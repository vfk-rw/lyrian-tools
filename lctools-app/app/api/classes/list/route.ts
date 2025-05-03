// API route to list all available class files
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

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
    
    // Fetch the generated class list JSON
    const response = await fetch(`${baseUrl}/data/class-list.json`);
    
    if (!response.ok) {
      // If the JSON file doesn't exist or can't be fetched, we might be in development 
      // and the file hasn't been generated yet. In that case, generate it on the fly.
      if (process.env.NODE_ENV === 'development') {
        const dataDir = path.join(process.cwd(), 'public', 'data', 'classes');
        
        // Check if the directory exists
        if (fs.existsSync(dataDir)) {
          // Read the directory and filter for YAML files
          const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.yaml')).sort();
          return NextResponse.json(files);
        }
      }
      
      console.error(`Failed to fetch class list: ${response.status}`);
      return NextResponse.json({ error: 'Failed to load class list' }, { status: 500 });
    }
    
    // Return the list from the JSON file
    const files = await response.json();
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing class files:', error);
    return NextResponse.json({ error: 'Failed to list class files' }, { status: 500 });
  }
}