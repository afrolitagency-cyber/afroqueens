import { prisma } from '@/lib/prisma'
import { eligibleSubscriberWhere } from '@/lib/newsletter'
import { getSiteUrl } from '@/lib/resend'
import NewsletterComposer from './NewsletterComposer'

export const dynamic = 'force-dynamic'

export default async function NewsletterComposePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string; tag?: string }>
}) {
  const params = await searchParams
  const audience =
    params.audience === 'selected' ? 'selected' : params.audience === 'tag' || params.tag ? 'tag' : 'all'

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const siteUrl = getSiteUrl()

  const [eligibleCount, tags, posts] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: eligibleSubscriberWhere() }),
    prisma.newsletterTag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { publishedAt: { gte: since } },
          { publishedAt: null, createdAt: { gte: since } },
        ],
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 40,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
  ])

  const digestPosts = posts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || `New on Afroqueens: ${p.title}`,
    category: p.category,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    url: `${siteUrl}/blog/${p.slug}`,
  }))

  const initialTagIds = params.tag && tags.some(t => t.id === params.tag) ? [params.tag] : []

  return (
    <NewsletterComposer
      eligibleCount={eligibleCount}
      tags={tags}
      initialAudience={audience}
      initialTagIds={initialTagIds}
      digestPosts={digestPosts}
      siteUrl={siteUrl}
    />
  )
}
