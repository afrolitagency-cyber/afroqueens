// app/(admin)/admin/inbox/page.tsx
import { prisma } from '@/lib/prisma'
import InboxAdmin from './InboxAdmin'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Inbox</div>
          <div className={styles.sub}>
            {submissions.filter(s => !s.read).length} unread messages
          </div>
        </div>
      </div>
      <InboxAdmin initial={JSON.parse(JSON.stringify(submissions))} />
    </div>
  )
}
