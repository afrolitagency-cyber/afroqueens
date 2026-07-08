// app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const BASE = 'https://afroqueens.fm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogs, artists, episodes] = await Promise.all([
    prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    prisma.artist.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.episode.findMany({ select: { id: true, updatedAt: true } }),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,              lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/artists`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/episodes`,lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE}/blog`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/gallery`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const blogPages: MetadataRoute.Sitemap = blogs.map(b => ({
    url:              `${BASE}/blog/${b.slug}`,
    lastModified:     b.updatedAt,
    changeFrequency:  'monthly' as const,
    priority:         0.7,
  }))

  const artistPages: MetadataRoute.Sitemap = artists.map(a => ({
    url:              `${BASE}/artists/${a.slug}`,
    lastModified:     a.updatedAt,
    changeFrequency:  'monthly' as const,
    priority:         0.7,
  }))

  const episodePages: MetadataRoute.Sitemap = episodes.map(ep => ({
    url:              `${BASE}/episodes/${ep.id}`,
    lastModified:     ep.updatedAt,
    changeFrequency:  'monthly' as const,
    priority:         0.7,
  }))

  return [...staticPages, ...blogPages, ...artistPages, ...episodePages]
}
