import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import type { Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { CHARACTER_TABLE_NAME } from '@/lib/supabase'
import { parse as parseCsvWithPapa } from 'papaparse'

// Helper to convert any Google Sheets URL containing /d/<ID>/ to the CSV export endpoint
function getGoogleSheetCsvUrl(sheetUrl: string): string | null {
  // For published HTML sheets, directly switch pubhtml -> pub?output=csv
  if (sheetUrl.includes('/pubhtml')) {
    return sheetUrl.replace(/\/pubhtml.*/, '/pub?output=csv')
  }
  // Extract spreadsheet ID
  const idMatch = sheetUrl.match(/\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/)
  if (!idMatch) return null
  const spreadsheetId = idMatch[1]
  // Extract gid (sheet/tab) or default to 0
  const gidMatch = sheetUrl.match(/[?&]gid=(\d+)/)
  const gid = gidMatch ? gidMatch[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
}

// Helper to fetch CSV from Google Sheets, with export fallback and gviz fallback for share links
async function fetchGoogleSheetCsv(csvUrl: string): Promise<string> {
  // Try export CSV endpoint
  let res = await fetch(csvUrl)
  let text = await res.text()
  const contentType = res.headers.get('content-type') || ''
  // If export responded with HTML or non-OK status, fallback to gviz CSV endpoint
  if (!res.ok || contentType.includes('text/html') || /^\s*</.test(text)) {
    console.debug(`[parse] Export CSV failed or returned HTML (${res.status}); attempting fallbacks`)
    // Extract spreadsheetId and default gid
    const idMatch = csvUrl.match(/\/d\/(?:e\/)?([a-zA-Z0-9-_]+)/)
    if (!idMatch) throw new Error(`Invalid CSV URL for fallback: ${csvUrl}`)
    const spreadsheetId = idMatch[1]
    // Determine gid for all fallback attempts
    const gidMatchForAll = csvUrl.match(/gid=(\d+)/)
    const gid = gidMatchForAll ? gidMatchForAll[1] : '0'
    // First fallback: export without gid param
    const baseExportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
    const fallbackRes = await fetch(baseExportUrl)
    const fallbackText = await fallbackRes.text()
    const fallbackType = fallbackRes.headers.get('content-type') || ''
    if (fallbackRes.ok && !fallbackType.includes('text/html') && !/^\s*</.test(fallbackText)) {
      console.debug('[parse] No-gid export succeeded')
      return fallbackText
    }
    console.debug(`[parse] No-gid export failed (${fallbackRes.status}); attempting generic export`)
    // Second fallback: generic spreadsheets/export endpoint
    console.debug('[parse] Attempting generic spreadsheets/export CSV endpoint')
    const altExportUrl = `https://docs.google.com/spreadsheets/export?format=csv&spreadsheetId=${spreadsheetId}&gid=${gid}`
    const altRes = await fetch(altExportUrl)
    const altText = await altRes.text()
    const altType = altRes.headers.get('content-type') || ''
    if (altRes.ok && !altType.includes('text/html') && !/^\s*</.test(altText)) {
      console.debug('[parse] Generic export endpoint succeeded')
      return altText
    }
    console.debug(`[parse] Generic export failed (${altRes.status}); attempting gviz fallback`)
    // Third fallback: gviz CSV endpoint
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?gid=${gid}&tqx=out:csv`
    res = await fetch(gvizUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet CSV via gviz fallback (${gvizUrl}, status ${res.status})`)
    }
    text = await res.text()
  }
  return text
}

// Helper to parse CSV with PapaParse
function parseCsv(csv: string): string[][] {
  const result = parseCsvWithPapa(csv, { skipEmptyLines: true })
  return (result.data as unknown) as string[][]
}

// Helper to sanitize text fields for DB
function sanitizeTextField(input: string, maxLength = 32): string {
  if (!input) return '';
  // Remove control characters and non-printable unicode
  // eslint-disable-next-line no-control-regex
  let sanitized = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  // Remove suspicious SQL patterns (very basic)
  sanitized = sanitized.replace(/(--|;|\/\*|\*\/|DROP|SELECT|INSERT|DELETE|UPDATE|CREATE|ALTER|EXEC|UNION)/gi, '');
  // Remove non-ASCII (optional, or use .normalize('NFKC') for unicode normalization)
  sanitized = sanitized.replace(/[^\x20-\x7E]/g, '');
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
}

// Helper to extract character info from CSV
function extractCharacterInfo(rows: string[][]) {
  let name = '', race = '', sub_race = '', spirit_core: number | null = null
  // Primary scan: look at each row's key/value pairs
  for (const row of rows.slice(0, 30)) {
    for (let i = 0; i < row.length; i += 2) {
      const key = row[i]?.trim()
      const value = row[i + 1]?.trim() || ''
      if (!key) continue
      if (!name && /character\s*name|^name$/i.test(key)) name = value
      if (!race && /^(race|species)$/i.test(key)) race = value
      if (!sub_race && /^sub[\s_-]?race$/i.test(key)) sub_race = value
      if (!spirit_core && /^(spirit[\s_-]?core|core|soul[\s_-]?core|sc)$/i.test(key)) {
        const num = parseInt(value)
        if (!isNaN(num)) spirit_core = num
      }
      if (name && race && sub_race && spirit_core) {
        return {
          name: sanitizeTextField(name),
          race: sanitizeTextField(race),
          sub_race: sanitizeTextField(sub_race),
          spirit_core
        }
      }
    }
  }
  // Fallback for spirit_core: look for any numeric in range 1000-3000
  for (const row of rows) {
    for (let i = 0; i < row.length; i += 2) {
      const val = row[i + 1]
      const num = parseInt(val)
      if (!isNaN(num) && num >= 1000 && num <= 3000) {
        spirit_core = num
        break
      }
    }
    if (spirit_core !== null) break
  }
  return {
    name: sanitizeTextField(name),
    race: sanitizeTextField(race),
    sub_race: sanitizeTextField(sub_race),
    spirit_core
  }
}

// Helper to extract class info from CSV rows
function extractClassInfo(rows: string[][]) {
  // Find the header row for classes
  const headerIndex = rows.findIndex(row => {
    const [c0, c1] = row
    return c0?.trim().toLowerCase() === 'class' && c1?.trim().toLowerCase().includes('class tier')
  })
  if (headerIndex === -1) return []
  const classes: { class_name: string; class_tier: number | null; class_level: number }[] = []
  // Parse subsequent rows until a non-class row is encountered
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const [name, tierStr, , costExpStr] = rows[i]
    if (!name?.trim()) break
    const class_level = parseInt(costExpStr)
    if (isNaN(class_level)) break
    const class_tier = parseInt(tierStr)
    classes.push({
      class_name: sanitizeTextField(name.trim()),
      class_tier: isNaN(class_tier) ? null : class_tier,
      class_level
    })
  }
  return classes
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '')

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context
  const { id } = await params
  let originalSheetUrl = ''
  try {
    const session = await getServerSession(authOptions) as Session | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id
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
    originalSheetUrl = sheet.sheet_url
    if (!csvUrl) {
      return NextResponse.json({ error: 'Invalid Google Sheet URL' }, { status: 400 })
    }
    console.debug(`[parse] Fetching CSV from URL: ${csvUrl}`)
    const csv = await fetchGoogleSheetCsv(csvUrl)
    console.debug(`[parse] Received CSV length: ${csv.length}`)
    const rows = parseCsv(csv)
    console.debug(`[parse] Parsed rows count: ${rows.length}`)
    const info = extractCharacterInfo(rows)
    console.debug(`[parse] Extracted info:`, info)
    const classes = extractClassInfo(rows)
    console.debug(`[parse] Extracted classes:`, classes)
    // Insert or update character_info in DB
    // Check if an entry already exists
    const { data: existingInfo, error: infoError } = await supabaseAdmin
      .from('character_info')
      .select('id')
      .eq('character_id', id)
      .maybeSingle()
    console.debug(`[parse] existingInfo record:`, existingInfo)
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
    // Sync character classes: delete old entries then insert new ones
    const { error: deleteClassError } = await supabaseAdmin
      .from('character_class_info')
      .delete()
      .eq('character_id', id)
    if (deleteClassError) {
      return NextResponse.json({ error: deleteClassError.message }, { status: 500 })
    }
    if (classes.length > 0) {
      const newClassRecords = classes.map(c => ({
        character_id: id,
        class_name: c.class_name,
        class_tier: c.class_tier,
        class_level: c.class_level
      }))
      const { error: insertClassError } = await supabaseAdmin
        .from('character_class_info')
        .insert(newClassRecords)
      if (insertClassError) {
        return NextResponse.json({ error: insertClassError.message }, { status: 500 })
      }
    }
    // Return parsed data for client logging
    return NextResponse.json({ success: true, info, classes })
  } catch (error: unknown) {
    console.error(`Error parsing sheet ${id} (URL: ${originalSheetUrl}):`, error)
    // Include stack trace in response for debugging
    return NextResponse.json({ error: (error as Error).message, stack: (error as Error).stack }, { status: 500 })
  }
}
