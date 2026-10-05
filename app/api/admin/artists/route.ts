// app/api/admin/artists/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffApi } from '@/lib/authz'

export async function GET() {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  const artists = await prisma.artist.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

  return NextResponse.json(artists)
}
