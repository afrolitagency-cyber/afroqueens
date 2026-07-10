import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { eligibleSubscriberWhere } from '@/lib/newsletter'
import NewsletterAdmin from './NewsletterAdmin'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function NewsletterPage() {
  const [subscribers, tags, eligibleCount] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tags: { select: { id: true, name: true } } },
    }),
    prisma.newsletterTag.findMany({ orderBy: { name: 'asc' } }),
    prisma.newsletterSubscriber.count({ where: eligibleSubscriberWhere() }),
  ])

  const serialized = subscribers.map(s => ({
    id: s.id,
    email: s.email,
    name: s.name,
    source: s.source,
    active: s.active,
    confirmedAt: s.confirmedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    tags: s.tags,
  }))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Newsletter</div>
          <div className={styles.sub}>
            {eligibleCount} confirmed recipient{eligibleCount === 1 ? '' : 's'} · {subscribers.length} total
          </div>
        </div>
        <Link href="/admin/newsletter/compose" className={styles.addBtn}>
          + Create Newsletter
        </Link>
      </div>
      <NewsletterAdmin initial={serialized} tags={tags} />
    </div>
  )
}
