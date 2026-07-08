// app/api/search/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({ posts: [], artists: [], episodes: [] })

  const [posts, artists, episodes] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title:   { contains: q, mode: 'insensitive' } },
          { excerpt: { contains: q, mode: 'insensitive' } },
          { category:{ contains: q, mode: 'insensitive' } },
          { author:  { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { title: true, slug: true, excerpt: true, coverImageUrl: true, category: true, publishedAt: true },
      take: 6,
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.artist.findMany({
      where: {
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { genre: { contains: q, mode: 'insensitive' } },
          { bio:   { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { name: true, slug: true, genre: true, profileImageUrl: true },
      take: 5,
    }),
    prisma.episode.findMany({
      where: {
        OR: [
          { title:       { contains: q, mode: 'insensitive' } },
          { subtitle:    { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, subtitle: true, description: true, coverImageUrl: true },
      take: 5,
    }),
  ])

  return NextResponse.json({ posts, artists, episodes })
}
