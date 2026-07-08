// app/api/admin/artists/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({ where: { id: params.id } })
  if (!artist) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(artist)
}
