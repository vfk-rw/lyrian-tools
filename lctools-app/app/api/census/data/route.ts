import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Fetch all characters with their classes
    const { data, error } = await supabase
      .from('census_characters')
      .select(`
        id,
        adventurer_name,
        adventurer_url,
        race,
        sub_race,
        spirit_core_current,
      census_character_classes (
        census_classes ( name, tier )
      )
      `)

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        return NextResponse.json({ error: 'Supabase tables missing. Please import census data.' }, { status: 500 })
      }
      return NextResponse.json({
        error: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      }, { status: 500 })
    }

    // Fetch the most recent update timestamp
    const { data: latest, error: latestError } = await supabase
      .from('census_characters')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestError) {
      if (latestError.message.includes('does not exist') || latestError.message.includes('relation')) {
        return NextResponse.json({ error: 'Supabase tables missing. Please import census data.' }, { status: 500 })
      }
      return NextResponse.json({
        error: latestError.message,
        details: (latestError as any).details,
        hint: (latestError as any).hint,
      }, { status: 500 })
    }

    const lastUpdated = latest?.created_at ?? null

    // Normalize rows for frontend
    const rows = (data || []).map((row: any) => ({
      id: row.id,
      name: row.adventurer_name,
      sheetUrl: row.adventurer_url,
      race: row.race,
      subRace: row.sub_race,
      spiritCore: row.spirit_core_current,
      classes: Array.isArray(row.census_character_classes)
        ? row.census_character_classes.map((cc: any) => ({
            name: cc.census_classes.name,
            tier: cc.census_classes.tier,
          }))
        : [],
    }))

    return NextResponse.json({ data: rows, lastUpdated })
  } catch (err: unknown) {
    console.error('Census data API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
