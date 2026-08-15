import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import EventRegisterForm from '@/components/public/events/EventRegisterForm'
import {
  EventActions,
  EventCountdown,
  EventShare,
} from '@/components/public/events/EventPageClient'
import { getCoverUrl } from '@/lib/images'
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
    openGraph: event.coverImageUrl ? { images: [event.coverImageUrl] } : undefined,
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      artists: {
        select: { id: true, name: true, slug: true, profileImageUrl: true },
        orderBy: { name: 'asc' },
      },
    },
  })
  if (!event || !event.published) notFound()

  const startsAt = event.startsAt.toISOString()
  const endsAt = event.endsAt?.toISOString() ?? null
  const dateLong = event.startsAt.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeRange = `${event.startsAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}${event.endsAt ? ` — ${event.endsAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}` : ''}`

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        {event.coverImageUrl && (
          <div
            className={styles.heroImage}
            style={{ backgroundImage: `url(${getCoverUrl(event.coverImageUrl, 'hero')})` }}
          />
        )}
        <div className={styles.heroOverlay} />
        <div className={styles.heroGlow} />
        <div className={`${styles.inner} ${styles.heroContent}`}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eventTag}>Upcoming event</span>
            <span>{dateLong}</span>
          </div>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          <div className={styles.heroMeta}>
            <span>◷ {timeRange}</span>
            {event.location && <span>⌖ {event.location}</span>}
          </div>
          <EventActions
            title={event.title}
            startsAt={startsAt}
            endsAt={endsAt}
            location={event.location}
            showRegister={event.registrationRequired}
          />
        </div>
      </header>

      <EventCountdown startsAt={startsAt} />

      <div className={`${styles.inner} ${styles.eventBody}`}>
        <div className={styles.eventGrid}>
          <article className={styles.aboutSection}>
            <div className={styles.eyebrow}>About the event</div>
            <h2>Everything you need to know</h2>
            <p className={styles.desc}>
              {event.description || (
                event.registrationRequired
                  ? 'Register below to save your spot and get event updates.'
                  : 'Check the details here for date, time, and venue.'
              )}
            </p>
            {event.artists.length > 0 && (
              <div className={styles.lineup}>
                <div className={styles.eyebrow}>Lineup</div>
                <div className={styles.lineupList}>
                  {event.artists.map(artist => (
                    <Link key={artist.id} href={`/artists/${artist.slug}`} className={styles.lineupChip}>
                      {artist.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className={styles.sidebar}>
            <div className={styles.detailsCard}>
              <h2>Event details</h2>
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>◷</span>
                <div>
                  <small>Date &amp; time</small>
                  <strong>{dateLong}</strong>
                  <span>{timeRange}</span>
                </div>
              </div>
              {event.location && (
                <div className={styles.detailItem}>
                  <span className={styles.detailIcon}>⌖</span>
                  <div>
                    <small>Location</small>
                    <strong>{event.location}</strong>
                  </div>
                </div>
              )}
              <div className={styles.detailItem}>
                <span className={styles.detailIcon}>◇</span>
                <div>
                  <small>Admission</small>
                  <strong>
                    {event.registrationRequired ? 'Registration required' : 'No registration needed'}
                  </strong>
                </div>
              </div>
              <EventActions
                title={event.title}
                startsAt={startsAt}
                endsAt={endsAt}
                location={event.location}
                compact
                showRegister={event.registrationRequired}
              />
            </div>
            <EventShare title={event.title} />
          </aside>
        </div>

        {event.registrationRequired && (
          <section className={styles.registrationSection} id="register">
            <div className={styles.registrationIntro}>
              <div className={styles.eyebrow}>Register</div>
              <h2>Save your spot</h2>
              <p>
                Registration is quick. We&apos;ll email your confirmation and any important event updates.
              </p>
            </div>
            <EventRegisterForm
              eventId={event.id}
              eventSlug={event.slug}
              eventTitle={event.title}
            />
          </section>
        )}
      </div>
    </main>
  )
}
