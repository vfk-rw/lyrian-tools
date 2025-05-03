// @ts-nocheck - API routes have inconsistent types in Next.js App Router
import { NextResponse } from 'next/server';
import yaml from 'js-yaml';
import { ClassData } from '@/lib/classes/class-utils';

/**
 * Helper function to get base URL depending on environment
 * This function properly handles Vercel deployments
 */
function getBaseUrl() {
  // For client-side requests, use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }
  
  // For server-side requests in production (Vercel)
  if (process.env.VERCEL_URL) {
    // Use the correct URL format for Vercel deployments
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // For server-side requests in local development
  return `http://localhost:${process.env.PORT || 3000}`;
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
      
      // Always replace image URLs with local images regardless of source
      // Use the class ID directly instead of transforming the name
      const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
      
      // Format should match the files you have in /images/classes/
      // E.g., "Anti-Mage.webp" instead of "Anti_Mage.webp"
      const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
      classData.image_url = `/images/classes/${imageName}`;
      
      return classData;
    });
    
    const allClasses = (await Promise.all(classPromises)).filter(Boolean);
    return NextResponse.json(allClasses);
  } catch (error) {
    console.error('Error loading classes:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}
