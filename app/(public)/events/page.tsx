import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import styles from './events.module.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Events | Afroqueens FM',
  description: 'Upcoming Afroqueens events — register and get updates.',
}

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { published: true, startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 12) } },
    orderBy: { startsAt: 'asc' },
  })

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Afroqueens live</div>
        <h1 className={styles.title}>Events</h1>
        <p className={styles.desc}>
          Register for upcoming events and we&apos;ll send you confirmation and reminders.
        </p>

        {events.length === 0 ? (
          <p className={styles.empty}>No upcoming events right now. Check back soon.</p>
        ) : (
          <div className={styles.list}>
            {events.map(ev => (
              <Link key={ev.id} href={`/events/${ev.slug}`} className={styles.card}>
                <div className={styles.cardTitle}>{ev.title}</div>
                <div className={styles.cardMeta}>
                  {ev.startsAt.toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {ev.location ? ` · ${ev.location}` : ''}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
