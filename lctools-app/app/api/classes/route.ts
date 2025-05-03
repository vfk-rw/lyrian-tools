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
    const baseUrl = getBaseUrl();
    
    // Fetch the class list from the generated JSON file
    const listResponse = await fetch(`${baseUrl}/data/class-list.json`);
    
    if (!listResponse.ok) {
      console.error(`Failed to fetch class list: ${listResponse.status}`);
      return NextResponse.json({ error: 'Failed to load class list' }, { status: 500 });
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
