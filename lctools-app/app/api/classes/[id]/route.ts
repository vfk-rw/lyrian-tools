// @ts-nocheck - API routes have inconsistent types in Next.js App Router
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ClassData } from '@/lib/classes/class-utils';

export async function GET(request, { params }) {
  const id = params.id;
  
  try {
    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }
    
    const classesDirectory = path.join(process.cwd(), 'lib/classes');
    const filePath = path.join(classesDirectory, `${id}.yaml`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = yaml.load(fileContents) as { class: ClassData };
    
    if (!data || !data.class) {
      return NextResponse.json({ error: 'Invalid class data' }, { status: 500 });
    }
    
    // Generate image path if needed
    if (typeof data.class.image_url === 'string' && 
        data.class.image_url.includes('cdn.angelssword.com')) {
      const imageName = `${data.class.name.replace(/\s+/g, '_')}.webp`;
      data.class.image_url = `/images/classes/${imageName}`;
    }
    
    return NextResponse.json(data.class);
  } catch (error) {
    console.error(`Error loading class ${id}:`, error);
    return NextResponse.json({ error: 'Failed to load class' }, { status: 500 });
  }
}
