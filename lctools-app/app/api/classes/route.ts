// @ts-nocheck - API routes have inconsistent types in Next.js App Router
import { NextResponse } from 'next/server';
import yaml from 'js-yaml';
import { ClassData } from '@/lib/classes/class-utils';

/**
 * Helper function to get base URL depending on environment
 */
function getBaseUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  } else {
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost:3000'}`;
  }
}

export async function GET() {
  try {
    // First, fetch the list of available class files
    const baseUrl = getBaseUrl();
    
    // Use the fetch API to get a directory listing
    // This is a special endpoint we'll create to list the class files
    const listResponse = await fetch(`${baseUrl}/api/classes/list`);
    
    if (!listResponse.ok) {
      // Fallback to a hardcoded list if we can't get the directory listing
      console.warn('Could not get class list, using fallback mechanism');
      return await getClassesWithFallback(baseUrl);
    }
    
    const files = await listResponse.json();
    
    // Now fetch each class file
    const classPromises = files.map(async (filename) => {
      const response = await fetch(`${baseUrl}/data/classes/${filename}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch class file ${filename}: ${response.status}`);
        return null;
      }
      
      const content = await response.text();
      // Use a more specific type instead of any
      const parsed = yaml.load(content) as { class: ClassData };
      const classData = parsed.class;
      
      // Generate image path if needed
      if (typeof classData.image_url === 'string' && 
          classData.image_url.includes('cdn.angelssword.com')) {
        const imageName = `${classData.name.replace(/\s+/g, '_')}.webp`;
        classData.image_url = `/images/classes/${imageName}`;
      }
      
      return classData;
    });
    
    const allClasses = (await Promise.all(classPromises)).filter(Boolean);
    return NextResponse.json(allClasses);
  } catch (error) {
    console.error('Error loading classes:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}

/**
 * Fallback function to get classes when directory listing fails
 */
async function getClassesWithFallback(baseUrl: string) {
  try {
    // This is a hardcoded list of known class files
    // These should match the filenames in public/data/classes/
    const knownFiles = [
      'abjurer.yaml', 'archsage.yaml', 'armiger.yaml', 'assassin.yaml', 'battlemaster.yaml',
      'electromancer.yaml', 'geomancer.yaml', 'guardian.yaml', 'high_priest.yaml', 'mage.yaml',
      'mage_knight.yaml', 'martial_artist.yaml', 'ninja.yaml', 'priest.yaml', 'protector.yaml',
      'saboteur.yaml', 'sky_knight.yaml', 'sniper.yaml', 'spellblade.yaml', 'wave_palm_style.yaml'
      // Add more known class files here as needed
    ];
    
    const classPromises = knownFiles.map(async (filename) => {
      try {
        const response = await fetch(`${baseUrl}/data/classes/${filename}`);
        
        if (!response.ok) {
          console.error(`Failed to fetch class file ${filename}: ${response.status}`);
          return null;
        }
        
        const content = await response.text();
        const parsed = yaml.load(content) as { class: ClassData };
        const classData = parsed.class;
        
        // Generate image path if needed
        if (typeof classData.image_url === 'string' && 
            classData.image_url.includes('cdn.angelssword.com')) {
          const imageName = `${classData.name.replace(/\s+/g, '_')}.webp`;
          classData.image_url = `/images/classes/${imageName}`;
        }
        
        return classData;
      } catch (err) {
        console.error(`Error processing class ${filename}:`, err);
        return null;
      }
    });
    
    const allClasses = (await Promise.all(classPromises)).filter(Boolean);
    return NextResponse.json(allClasses);
  } catch (error) {
    console.error('Error in fallback class loading:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}
