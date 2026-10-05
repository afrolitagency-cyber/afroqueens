// app/api/admin/media/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isMediaFolder } from '@/lib/mediaAssets'
import { requireStaffApi } from '@/lib/authz'

export async function GET(req: NextRequest) {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder')
  const q = searchParams.get('q')?.trim() || ''
  const take = Math.min(Number(searchParams.get('take') || 60) || 60, 120)
  const cursor = searchParams.get('cursor')

  const where = {
    ...(folder && isMediaFolder(folder) ? { folder } : {}),
    ...(q
      ? {
          OR: [
            { filename: { contains: q, mode: 'insensitive' as const } },
            { alt: { contains: q, mode: 'insensitive' as const } },
            { publicId: { contains: q, mode: 'insensitive' as const } },
            { url: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const items = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > take
  const page = hasMore ? items.slice(0, take) : items
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null

  return NextResponse.json({ items: page, nextCursor })
}
