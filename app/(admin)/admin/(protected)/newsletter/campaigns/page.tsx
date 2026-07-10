import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import CampaignHistory from './CampaignHistory'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function NewsletterCampaignsPage() {
  const campaigns = await prisma.newsletterCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      sendLogs: { select: { status: true } },
    },
  })

  const rows = campaigns.map(c => {
    const pending = c.sendLogs.filter(l => l.status === 'pending').length
    const sent = c.sendLogs.filter(l => l.status === 'sent').length
    const failed = c.sendLogs.filter(l => l.status === 'failed').length
    return {
      id: c.id,
      subject: c.subject,
      status: c.status,
      recipientMode: c.recipientMode,
      recipientCount: c.recipientCount,
      sentCount: sent || c.sentCount,
      failedCount: failed || c.failedCount,
      pendingCount: pending,
      scheduledFor: c.scheduledFor?.toISOString() ?? null,
      sentAt: c.sentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      errorMessage: c.errorMessage,
    }
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Campaign history</div>
          <div className={styles.sub}>Send logs, schedules, and delivery status</div>
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <Link href="/admin/newsletter" className={styles.addBtn} style={{ background: '#fff', color: '#444', border: '1px solid #e5e5e5' }}>
            ← Subscribers
          </Link>
          <Link href="/admin/newsletter/compose" className={styles.addBtn}>
            + Compose
          </Link>
        </div>
      </div>
      <CampaignHistory campaigns={rows} />
    </div>
  )
}
