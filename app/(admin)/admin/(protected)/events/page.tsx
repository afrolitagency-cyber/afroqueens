import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { deleteEvent } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: 'desc' },
    include: {
      tag: true,
      _count: { select: { registrations: true } },
    },
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Events</div>
          <div className={styles.sub}>
            Public registration pages · tagged lists for reminders
          </div>
        </div>
        <Link href="/admin/events/new" className={styles.addBtn}>
          + New Event
        </Link>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>When</th>
              <th>Tag</th>
              <th>Registrations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No events yet. Create one to get a public register link.
                </td>
              </tr>
            )}
            {events.map(ev => (
              <tr key={ev.id}>
                <td className={styles.postTitle}>
                  <div>{ev.title}</div>
                  <div className={styles.date}>/events/{ev.slug}</div>
                </td>
                <td className={styles.date}>
                  {ev.startsAt.toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td className={styles.date}>{ev.tag?.name ?? '—'}</td>
                <td className={styles.date}>{ev._count.registrations}</td>
                <td>
                  <span className={`${styles.status} ${ev.published ? styles.pub : styles.draft}`}>
                    {ev.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                    <Link href={`/events/${ev.slug}`} className={styles.actionBtn} target="_blank">
                      View
                    </Link>
                    <Link href={`/admin/events/${ev.id}/edit`} className={styles.actionBtn}>
                      Edit
                    </Link>
                    <Link
                      href={`/admin/newsletter/compose?audience=tag&tag=${ev.tag?.id ?? ''}`}
                      className={styles.actionBtn}
                    >
                      Notify
                    </Link>
                    <form
                      action={async () => {
                        'use server'
                        await deleteEvent(ev.id)
                      }}
                      style={{ display: 'inline' }}
                    >
                      <button type="submit" className={`${styles.actionBtn} ${styles.del}`}>
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
