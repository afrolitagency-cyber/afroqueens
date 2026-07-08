// app/(public)/episodes/[id]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { buildMetadata, podcastEpisodeJsonLd } from '@/lib/seo'
import styles from './episode.module.css'

interface Props { params: { id: string } }

const CAT_LABELS: Record<string, string> = {
  INTERVIEWS:        'Interviews',
  EVENT_COVERAGE:    'Event Coverage',
  DEEP_DIVES:        'Deep Dives',
  PANEL_DISCUSSIONS: 'Panel Discussions',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ep = await prisma.episode.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, coverImageUrl: true, number: true },
  })
  if (!ep) return {}
  return buildMetadata({
    title:       `EP${String(ep.number).padStart(2,'0')}: ${ep.title} — Afroqueens FM`,
    description: ep.description ?? ep.title,
    slug:        `episodes/${params.id}`,
    image:       ep.coverImageUrl ?? undefined,
  })
}

export async function generateStaticParams() {
  const eps = await prisma.episode.findMany({ select: { id: true } })
  return eps.map(e => ({ id: e.id }))
}

export default async function EpisodePage({ params }: Props) {
  const ep = await prisma.episode.findUnique({ where: { id: params.id } })
  if (!ep) notFound()

  const jsonLd = podcastEpisodeJsonLd({
    id:          ep.id,
    title:       ep.title,
    description: ep.description ?? ep.title,
    audioUrl:    ep.audioUrl,
    image:       ep.coverImageUrl,
    releaseDate: ep.releaseDate,
    duration:    ep.duration,
  })

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className={styles.hero}>
        {ep.coverImageUrl && (
          <div className={styles.heroBg} style={{ backgroundImage: `url(${ep.coverImageUrl})` }} />
        )}
        <div className={styles.heroOverlay} />
        <div className={`si ${styles.heroContent}`}>
          <div className={styles.epNumber}>Episode {String(ep.number).padStart(2, '0')}</div>
          <div className={styles.category}>{CAT_LABELS[ep.category] ?? ep.category}</div>
          <h1 className={styles.title}>{ep.title}</h1>
          {ep.subtitle && <p className={styles.subtitle}>{ep.subtitle}</p>}
          <div className={styles.meta}>
            <span>{ep.duration}</span>
            <span className={styles.dot}>·</span>
            <span>{new Date(ep.releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Player */}
      {ep.audioUrl && (
        <div className={`si ${styles.playerSection}`}>
          <audio controls className={styles.audio} src={ep.audioUrl}>
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {/* Body */}
      <div className={`si ${styles.body}`}>
        {ep.description && (
          <div className={styles.description}>
            <h2 className={styles.sectionTitle}>About this episode</h2>
            <p>{ep.description}</p>
          </div>
        )}
      </div>
    </main>
  )
}
