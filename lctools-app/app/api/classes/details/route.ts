// API route to get a single class by ID via query parameter
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

export async function GET(request: Request) {
  try {
    // Get id from query string
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    const baseUrl = getBaseUrl();
    
    // Attempt to fetch the class data file by ID
    const response = await fetch(`${baseUrl}/data/classes/${id}.yaml`);
    
    if (!response.ok) {
      console.error(`Failed to fetch class file for ID ${id}: ${response.status}`);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
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
    
    return NextResponse.json(classData);
  } catch (error) {
    console.error(`Error fetching class by ID:`, error);
    return NextResponse.json({ error: 'Failed to fetch class data' }, { status: 500 });
  }
}