import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { CHARACTER_TABLE_NAME } from '@/lib/supabase'

// Initialize Supabase with admin privileges
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

// PATCH to update sheet status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Missing Supabase credentials.' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params
    const body = await request.json()
    const { status } = body

    // Check if sheet belongs to user
    const { data: existingSheet, error: fetchError } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    
    if (!existingSheet || existingSheet.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the sheet
    const { data, error } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId) // Extra security check
      .select()

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (error: unknown) {
    console.error('Error updating sheet:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// DELETE to remove a sheet
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if Supabase environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Missing Supabase credentials.' },
        { status: 500 }
      )
    }
    
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = params

    // Check if sheet belongs to user
    const { data: existingSheet, error: fetchError } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // Not found is ok for deletion
      throw fetchError
    }
    
    if (existingSheet && existingSheet.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the sheet
    const { error } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Extra security check

    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    console.error('Error deleting sheet:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

// GET to fetch character info for a sheet/character id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Missing Supabase credentials.' },
        { status: 500 }
      )
    }
    const { id } = params
    // Fetch character and join character_info
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('id, character_info(name)')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json({}, { status: 404 })
      }
      throw error
    }
    return NextResponse.json(data || {})
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}