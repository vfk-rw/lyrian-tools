import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to validate if a URL is a valid Google Sheets link
export function isValidGoogleSheetUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'docs.google.com' && 
           (urlObj.pathname.includes('/spreadsheets/') || urlObj.pathname.includes('/document/'));
  } catch {
    return false;
  }
}

// Table name for character sheets
export const CHARACTER_TABLE_NAME = 'characters';

// Character sheet status options
export const CHARACTER_STATUSES = ['active', 'inactive', 'retired', 'dead'] as const;
export type CharacterStatus = typeof CHARACTER_STATUSES[number];

// Character sheet interface
export interface CharacterSheet {
  id: string;
  user_id: string;
  sheet_url: string;
  status: CharacterStatus;
  created_at: string;
  updated_at: string; // Added to match DB schema and usage
}