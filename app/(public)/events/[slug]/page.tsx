import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EventRegisterForm from '@/components/public/events/EventRegisterForm'
import styles from '../events.module.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event || !event.published) return { title: 'Event | Afroqueens FM' }
  return {
    title: `${event.title} | Afroqueens FM`,
    description: event.description?.slice(0, 160) || `Register for ${event.title}`,
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug } })
  if (!event || !event.published) notFound()

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Event</div>
        <h1 className={styles.title}>{event.title}</h1>
        <div className={styles.meta}>
          <span>
            {event.startsAt.toLocaleString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {event.location && <span>{event.location}</span>}
        </div>

        <div className={styles.grid}>
          <div>
            {event.description ? (
              <p className={styles.desc}>{event.description}</p>
            ) : (
              <p className={styles.desc}>Register below to save your spot and get event updates.</p>
            )}
          </div>
          <EventRegisterForm
            eventId={event.id}
            eventSlug={event.slug}
            eventTitle={event.title}
          />
        </div>
      </div>
    </main>
  )
}
