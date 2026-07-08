// app/(admin)/admin/newsletter/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import NewsletterAdmin from './NewsletterAdmin'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function NewsletterPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  })
  const activeCount = subscribers.filter(s => s.active).length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Newsletter</div>
          <div className={styles.sub}>
            {activeCount} active subscriber{activeCount === 1 ? '' : 's'}
          </div>
        </div>
        <Link href="/admin/newsletter/compose" className={styles.addBtn}>
          + Create Newsletter
        </Link>
      </div>
      <NewsletterAdmin initial={JSON.parse(JSON.stringify(subscribers))} />
    </div>
  )
}
