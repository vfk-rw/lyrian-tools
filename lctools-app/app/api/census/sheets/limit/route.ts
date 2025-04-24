import { NextResponse } from 'next/server'

// You can make this dynamic if you want, but for now just return 50
export async function GET() {
  return NextResponse.json({ limit: 50 })
}
