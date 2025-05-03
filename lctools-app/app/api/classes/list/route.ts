// API route to list all available class files
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // When running in development mode, we can read the files directly
    if (process.env.NODE_ENV === 'development') {
      const dataDir = path.join(process.cwd(), 'public', 'data', 'classes');
      
      // Check if the directory exists
      if (!fs.existsSync(dataDir)) {
        console.warn('Classes directory does not exist:', dataDir);
        return NextResponse.json([]);
      }
      
      // Read the directory and filter for YAML files
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.yaml'));
      return NextResponse.json(files);
    } 
    // In production on Vercel, we need to return a static list of files
    else {
      // This should be the same list as in the fallback function in the main route
      const knownFiles = [
        'abjurer.yaml', 'archsage.yaml', 'armiger.yaml', 'assassin.yaml', 'battlemaster.yaml',
        'electromancer.yaml', 'geomancer.yaml', 'guardian.yaml', 'high_priest.yaml', 'mage.yaml',
        'mage_knight.yaml', 'martial_artist.yaml', 'ninja.yaml', 'priest.yaml', 'protector.yaml',
        'saboteur.yaml', 'sky_knight.yaml', 'sniper.yaml', 'spellblade.yaml', 'wave_palm_style.yaml'
        // Add more known class files as needed
      ];
      
      return NextResponse.json(knownFiles);
    }
  } catch (error) {
    console.error('Error listing class files:', error);
    return NextResponse.json({ error: 'Failed to list class files' }, { status: 500 });
  }
}