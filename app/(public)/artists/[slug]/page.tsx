// app/(public)/artists/[slug]/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { buildMetadata, artistJsonLd } from '@/lib/seo'
import ArtistLinks from '@/components/public/artists/ArtistLinks'
import ArtistDiscography from '@/components/public/artists/ArtistDiscography'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'
import { getCoverUrl } from '@/lib/images'
import styles from './artist.module.css'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await prisma.artist.findUnique({
    where: { slug: params.slug },
    select: { name: true, genre: true, bio: true, profileImageUrl: true },
  })
  if (!artist) return {}
  return buildMetadata({
    title:       `${artist.name} — Afroqueens FM`,
    description: artist.bio ?? `${artist.name} — ${artist.genre} artist on Afroqueens FM`,
    slug:        `artists/${params.slug}`,
    image:       artist.profileImageUrl ?? undefined,
  })
}

export default async function ArtistPage({ params }: Props) {
  const artist = await prisma.artist.findUnique({
    where: { slug: params.slug },
    include: {
      releases: {
        orderBy: [{ order: 'asc' }, { year: 'desc' }],
        include: { tracks: { orderBy: { number: 'asc' } } },
      },
    },
  })
  if (!artist) notFound()

  const [stories, upcomingEvents] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: 'PUBLISHED',
        audience: 'ARTIST',
        artistId: artist.id,
      },
      orderBy: { publishedAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        category: true,
        publishedAt: true,
        coverImageUrl: true,
        readingTime: true,
      },
    }),
    prisma.event.findMany({
      where: {
        published: true,
        startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 12) },
        artists: { some: { id: artist.id } },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        startsAt: true,
        coverImageUrl: true,
      },
    }),
  ])

  const jsonLd = artistJsonLd({
    name:  artist.name,
    slug:  artist.slug,
    bio:   artist.bio,
    genre: artist.genre,
    image: artist.profileImageUrl,
  })

  const getEmbedSrc = () => {
    if (artist.streamSource === 'YOUTUBE') {
      const id = extractYoutubeVideoId(artist.youtubeVideoId)
      if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
    }
    if (artist.streamSource === 'SPOTIFY') {
      const id = extractSpotifyTrackId(artist.spotifyTrackId)
      if (id) return `https://open.spotify.com/embed/track/${id}`
    }
    if (artist.streamSource === 'SOUNDCLOUD' && artist.soundcloudUrl)
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(artist.soundcloudUrl)}&color=%23C8102E&hide_related=true&show_comments=false`
    return null
  }
  const embedSrc = getEmbedSrc()

  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className={styles.hero}>
        {artist.profileImageUrl && (
          <div className={styles.heroBg} style={{ backgroundImage: `url(${artist.profileImageUrl})` }} />
        )}
        <div className={styles.heroOverlay} />
        <div className={`si ${styles.heroContent}`}>
          {artist.profileImageUrl && (
            <div className={styles.avatarWrap}>
              <Image
                src={artist.profileImageUrl}
                alt={artist.name}
                width={120}
                height={120}
                className={styles.avatar}
              />
            </div>
          )}
          <div className={styles.genrePill}>{artist.genre}</div>
          <h1 className={styles.name}>{artist.name}</h1>
          <div className={styles.meta}>
            {artist.location && <span>{artist.location}</span>}
            {artist.monthlyListeners && (
              <><span className={styles.dot}>·</span><span>{artist.monthlyListeners} monthly listeners</span></>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`si ${styles.content}`}>
        {artist.bio && (
          <div className={styles.bio}>
            <h2 className={styles.sectionTitle}>About</h2>
            <p>{artist.bio}</p>
          </div>
        )}

        <ArtistLinks artist={artist} />

        {/* Player embed */}
        {embedSrc && (
          <div className={styles.playerSection}>
            <h2 className={styles.sectionTitle}>Listen</h2>
            <div className={styles.embedWrap}>
              <iframe
                src={embedSrc}
                className={styles.embed}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={`${artist.name} — music player`}
              />
            </div>
          </div>
        )}
        {artist.streamSource === 'CUSTOM' && artist.customAudioUrl && (
          <div className={styles.playerSection}>
            <h2 className={styles.sectionTitle}>Listen</h2>
            <audio controls className={styles.audio} src={artist.customAudioUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {artist.releases.length > 0 && (
          <ArtistDiscography artistName={artist.name} releases={artist.releases} />
        )}

        {upcomingEvents.length > 0 && (
          <section className={styles.stories}>
            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
            <p className={styles.storiesLead}>Live dates and appearances featuring {artist.name}.</p>
            <div className={styles.storiesList}>
              {upcomingEvents.map(event => (
                <Link key={event.id} href={`/events/${event.slug}`} className={styles.storyCard}>
                  <div
                    className={`${styles.eventCover} ${!event.coverImageUrl ? styles.storyCoverEmpty : ''}`}
                    style={
                      event.coverImageUrl
                        ? { backgroundImage: `url(${getCoverUrl(event.coverImageUrl, 'card')})` }
                        : undefined
                    }
                  />
                  <div className={styles.storyBody}>
                    <div className={styles.storyCat}>Live</div>
                    <h3 className={styles.storyTitle}>{event.title}</h3>
                    <p className={styles.storyMeta}>
                      {event.startsAt.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                      })}
                      {' · '}
                      {event.startsAt.toLocaleTimeString('en-GB', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.location && <p className={styles.storyExc}>{event.location}</p>}
                    <span className={styles.eventCta}>Get tickets →</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {stories.length > 0 && (
          <section className={styles.stories}>
            <h2 className={styles.sectionTitle}>Stories</h2>
            <p className={styles.storiesLead}>Features and updates about {artist.name}.</p>
            <div className={styles.storiesList}>
              {stories.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className={styles.storyCard}>
                  <div
                    className={`${styles.storyCover} ${!post.coverImageUrl ? styles.storyCoverEmpty : ''}`}
                    style={
                      post.coverImageUrl
                        ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'card')})` }
                        : undefined
                    }
                  />
                  <div className={styles.storyBody}>
                    <div className={styles.storyCat}>{post.category}</div>
                    <h3 className={styles.storyTitle}>{post.title}</h3>
                    {post.excerpt && <p className={styles.storyExc}>{post.excerpt}</p>}
                    <div className={styles.storyMeta}>
                      {post.publishedAt?.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {post.readingTime ? ` · ${post.readingTime} min read` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
