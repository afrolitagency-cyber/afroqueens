// app/api/admin/episodes/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/authz'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  const episode = await prisma.episode.findUnique({ where: { id: params.id } })
  if (!episode) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(episode)
}
