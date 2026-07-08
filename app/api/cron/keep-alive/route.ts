import { NextResponse } from 'next/server'
import { keepAliveSucceeded, pingKeepAliveServices } from '@/lib/keepAlive'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Ping Neon Postgres + Supabase Storage so free-tier projects stay awake.
 * Hit from Vercel Cron (daily on Hobby) or an external scheduler every ~4–5 min.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await pingKeepAliveServices()
  const ok = keepAliveSucceeded(result)

  return NextResponse.json(
    {
      ok,
      ...result,
      at: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  )
}

export async function POST(req: Request) {
  return GET(req)
}
