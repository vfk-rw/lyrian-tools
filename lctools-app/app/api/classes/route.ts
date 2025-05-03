// @ts-nocheck - API routes have inconsistent types in Next.js App Router
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ClassData } from '@/lib/classes/class-utils';

export async function GET() {
  try {
    const classesDir = path.join(process.cwd(), 'lib/classes');
    const files = fs.readdirSync(classesDir).filter(f => f.endsWith('.yaml'));
    
    const allClasses = files.map(file => {
      const filePath = path.join(classesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
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
    
    return NextResponse.json(allClasses);
  } catch (error) {
    console.error('Error loading classes:', error);
    return NextResponse.json({ error: 'Failed to load classes' }, { status: 500 });
  }
}
