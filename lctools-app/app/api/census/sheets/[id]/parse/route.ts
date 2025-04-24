import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { CHARACTER_TABLE_NAME } from '@/lib/supabase'

// Helper to convert Google Sheets URL to CSV export URL
function getGoogleSheetCsvUrl(sheetUrl: string): string | null {
  const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (!idMatch) return null
  const spreadsheetId = idMatch[1]
  let gid = '0'
  const gidMatch = sheetUrl.match(/[?&#]gid=(\d+)/)
  if (gidMatch) gid = gidMatch[1]
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
}

// Helper to fetch CSV from Google Sheets
async function fetchGoogleSheetCsv(csvUrl: string): Promise<string> {
  const res = await fetch(csvUrl)
  if (!res.ok) throw new Error('Failed to fetch Google Sheet CSV')
  return await res.text()
}

// Helper to parse CSV (simple, assumes comma separator)
function parseCsv(csv: string): string[][] {
  return csv.split(/\r?\n/).map(row => row.split(','))
}

// Helper to extract character info from CSV
function extractCharacterInfo(rows: string[][]) {
  // Implement parsing logic as per notes/parsing_character_sheet_csv.md
  let name = '', race = '', sub_race = '', spirit_core = null
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const [key, value] = rows[i]
    if (!key) continue
    const k = key.trim().toLowerCase()
    if (!name && /name/.test(k)) name = value?.trim() || ''
    if (!race && /race/.test(k)) race = value?.trim() || ''
    if (!sub_race && /sub.?race/.test(k)) sub_race = value?.trim() || ''
    if (!spirit_core && /spirit.?core|core|soul.?core|sc/.test(k)) {
      const num = parseInt(value)
      if (!isNaN(num)) spirit_core = num
    }
  }
  return { name, race, sub_race, spirit_core }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
    // Get the character ID from dynamic route
    const { id } = await params
    // Get the sheet_url from DB
    const { data: sheet, error: fetchError } = await supabaseAdmin
      .from(CHARACTER_TABLE_NAME)
      .select('sheet_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (fetchError || !sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 })
    }
    const csvUrl = getGoogleSheetCsvUrl(sheet.sheet_url)
    if (!csvUrl) {
      return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 })
    }
    const csv = await fetchGoogleSheetCsv(csvUrl)
    const rows = parseCsv(csv)
    const info = extractCharacterInfo(rows)
    // Insert or update character_info in DB
    // Check if an entry already exists
    const { data: existingInfo, error: infoError } = await supabaseAdmin
      .from('character_info')
      .select('id')
      .eq('character_id', id)
      .maybeSingle()
    if (infoError) {
      return NextResponse.json({ error: infoError.message }, { status: 500 })
    }
    const record = {
      character_id: id,
      name: info.name,
      race: info.race,
      sub_race: info.sub_race,
      spirit_core: info.spirit_core,
      last_parsed: new Date().toISOString(),
    }
    if (existingInfo) {
      const { error: updateError } = await supabaseAdmin
        .from('character_info')
        .update(record)
        .eq('character_id', id)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('character_info')
        .insert(record)
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error parsing sheet:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
