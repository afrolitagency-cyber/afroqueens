import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processCampaignBatch } from '@/lib/newsletterSend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== 'production'
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/** Process scheduled campaigns + resume in-progress sends */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const dueScheduled = await prisma.newsletterCampaign.findMany({
    where: { status: 'SCHEDULED', scheduledFor: { lte: now } },
    select: { id: true },
    take: 5,
  })

  const inProgress = await prisma.newsletterCampaign.findMany({
    where: { status: 'SENDING' },
    select: { id: true },
    take: 5,
  })

  const ids = Array.from(new Set([...dueScheduled, ...inProgress].map(c => c.id)))
  const results = []

  for (const id of ids) {
    const result = await processCampaignBatch(id, 15)
    results.push({ id, ...result })
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}

export async function POST(req: Request) {
  return GET(req)
}
