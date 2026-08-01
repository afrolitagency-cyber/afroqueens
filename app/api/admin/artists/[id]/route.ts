// app/api/admin/artists/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({
    where: { id: params.id },
    include: {
      account: { select: { email: true } },
      releases: {
        orderBy: [{ order: 'asc' }, { year: 'desc' }],
        include: { tracks: { orderBy: { number: 'asc' } } },
      },
    },
  })
  if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(artist)
}
