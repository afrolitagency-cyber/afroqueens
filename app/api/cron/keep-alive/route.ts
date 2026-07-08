import { NextResponse } from 'next/server'
import { pingDatabase } from '@/lib/dbPing'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/** Ping the database to keep Neon compute awake. Hit via cron every ~4–5 min. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { latencyMs } = await pingDatabase()
    return NextResponse.json({
      ok: true,
      latencyMs,
      at: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database unreachable'
    return NextResponse.json({ ok: false, error: message }, { status: 503 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
