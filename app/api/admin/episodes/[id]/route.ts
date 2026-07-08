// app/api/admin/episodes/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const episode = await prisma.episode.findUnique({ where: { id: params.id } })
  if (!episode) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(episode)
}
