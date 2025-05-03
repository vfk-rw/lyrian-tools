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
    
    // First try to get the list of class files
    try {
      // Attempt to get the class list first to find the exact filename
      const listResponse = await fetch(`${baseUrl}/data/class-list.json`);
      
      if (listResponse.ok) {
        const classFiles = await listResponse.json();
        // Find the matching class file - handle both exact and normalized filenames
        const classFile = classFiles.find(
          (file: string) => 
            file === `${id}.yaml` || // Exact match
            file.toLowerCase() === `${id.toLowerCase()}.yaml` || // Case-insensitive match
            file.replace(/[-_]/g, '').toLowerCase() === id.replace(/[-_]/g, '').toLowerCase() // Normalized match (ignore hyphens/underscores)
        );
        
        if (classFile) {
          // Found a matching file, fetch its contents
          console.log(`Found matching class file: ${classFile} for ID: ${id}`);
          
          const response = await fetch(`${baseUrl}/data/classes/${classFile}`);
          
          if (response.ok) {
            const content = await response.text();
            const parsed = yaml.load(content) as { class: ClassData };
            const classData = parsed.class;
            
            // Always replace image URLs with local images regardless of source
            const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
            
            // Format should match the files you have in /images/classes/
            // E.g., "Anti-Mage.webp" instead of "Anti_Mage.webp"
            const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
            classData.image_url = `/images/classes/${imageName}`;
            
            return NextResponse.json(classData);
          }
        }
      }
    } catch (listError) {
      console.error('Error fetching class list:', listError);
      // Continue to fallback approach
    }
    
    // Fallback to direct file fetch if the above approach fails
    console.log(`Attempting direct fetch for class file: ${id}.yaml`);
    const response = await fetch(`${baseUrl}/data/classes/${id}.yaml`);
    
    if (!response.ok) {
      console.error(`Failed to fetch class file for ID ${id}: ${response.status}`);
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    const content = await response.text();
    const parsed = yaml.load(content) as { class: ClassData };
    const classData = parsed.class;
    
    // Always replace image URLs with local images regardless of source
    const classId = classData.id || classData.name.toLowerCase().replace(/[\s-]+/g, '_');
    
    // Format should match the files you have in /images/classes/
    // E.g., "Anti-Mage.webp" instead of "Anti_Mage.webp"
    const imageName = `${classId.charAt(0).toUpperCase() + classId.slice(1).replace(/_/g, '-')}.webp`;
    classData.image_url = `/images/classes/${imageName}`;
    
    return NextResponse.json(classData);
  } catch (error) {
    console.error(`Error fetching class by ID:`, error);
    return NextResponse.json({ error: 'Failed to fetch class data' }, { status: 500 });
  }
}