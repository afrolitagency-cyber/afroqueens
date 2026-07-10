import { prisma } from '@/lib/prisma'
import { eligibleSubscriberWhere } from '@/lib/newsletter'
import NewsletterComposer from './NewsletterComposer'

export const dynamic = 'force-dynamic'

export default async function NewsletterComposePage({
  searchParams,
}: {
  searchParams: Promise<{ audience?: string }>
}) {
  const params = await searchParams
  const audience =
    params.audience === 'selected' ? 'selected' : params.audience === 'tag' ? 'tag' : 'all'

  const [eligibleCount, tags] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: eligibleSubscriberWhere() }),
    prisma.newsletterTag.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <NewsletterComposer
      eligibleCount={eligibleCount}
      tags={tags}
      initialAudience={audience}
    />
  )
}
