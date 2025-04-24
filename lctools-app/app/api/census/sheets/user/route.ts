import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { CHARACTER_TABLE_NAME } from '@/lib/supabase'

// Initialize Supabase with admin privileges (service role)
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

// GET the current user's sheets
export async function GET() {
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

    const { data, error } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: unknown) {
    console.error('Error fetching user sheets:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}