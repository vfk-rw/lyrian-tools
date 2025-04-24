import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { isValidGoogleSheetUrl, CHARACTER_TABLE_NAME } from '@/lib/supabase'

export const CHARACTER_SHEET_LIMIT = 50;

// Initialize Supabase with admin privileges (service role)
// Using environment variables on the server side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

// Check if required environment variables are set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env.local file.')
}

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)

// GET all sheets for the census page
export async function GET() {
  try {
    // Check if Supabase environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Missing Supabase credentials.' },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching sheets:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// GET /api/census/sheets/limit - returns the character sheet limit for frontend
export async function GET_LIMIT() {
  return NextResponse.json({ limit: CHARACTER_SHEET_LIMIT })
}

// POST to add a new sheet
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Missing Supabase credentials.' },
        { status: 500 }
      )
    }

    // Get session to verify the user
    const session = await getServerSession(authOptions) as Session | null
    
    // Check if user is authenticated and has an ID
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Parse the request body
    const body = await request.json()
    const { sheet_url, status } = body

    // Basic validation
    if (!sheet_url) {
      return NextResponse.json({ error: 'Sheet URL is required' }, { status: 400 })
    }

    if (!isValidGoogleSheetUrl(sheet_url)) {
      return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 })
    }

    // Check if user already has CHARACTER_SHEET_LIMIT sheets
    const { data: existingSheets, error: countError } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('id')
      .eq('user_id', userId)
    if (countError) throw countError
    if (existingSheets && existingSheets.length >= CHARACTER_SHEET_LIMIT) {
      return NextResponse.json(
        { error: `You can only have up to ${CHARACTER_SHEET_LIMIT} character sheets` },
        { status: 400 }
      )
    }

    console.log("Adding sheet for user:", userId, "URL:", sheet_url, "Status:", status)

    // Insert the new sheet
    const { data, error } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .insert([
        {
          user_id: userId,
          sheet_url,
          status: status || 'active'
        }
      ])
      .select()

    if (error) {
      console.error("Supabase insert error:", error)
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: unknown) {
    console.error('Error adding sheet:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}