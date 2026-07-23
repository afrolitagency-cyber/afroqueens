// app/(public)/page.tsx
import { prisma } from '@/lib/prisma'
import Hero from '@/components/public/hero/Hero'
import ArtistCard from '@/components/public/artists/ArtistCard'
import NowPlaying from '@/components/player/NowPlaying'
import Link from 'next/link'
import styles from './home.module.css'
import { buildMetadata } from '@/lib/seo'
import { getCoverUrl } from '@/lib/images'
import NewsletterSignup from '@/components/public/newsletter/NewsletterSignup'

export const revalidate = 60 // ISR — revalidate every 60s

export const metadata = buildMetadata({
  title: 'Afroqueens FM — African Music, Culture & Podcast',
  description: 'Afroqueens FM — celebrating women in Afrobeats and African music culture. Listen to episodes, discover artists, and read the blog.',
  slug: '',
})

async function getData() {
  const [featuredArtist, artists, blogPosts, episodes, galleryItems] =
    await Promise.all([
      // Hero artist
      prisma.artist.findFirst({
        where: { featured: true },
        orderBy: { order: 'asc' },
      }),
      // Artists section (4)
      prisma.artist.findMany({
        take: 4,
        orderBy: { order: 'asc' },
      }),
      // Blog posts (5)
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        take: 5,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true, title: true, slug: true,
          excerpt: true, category: true, publishedAt: true,
          readingTime: true, featured: true, coverImageUrl: true,
        },
      }),
      // Episodes (4)
      prisma.episode.findMany({
        take: 4,
        orderBy: { number: 'desc' },
        select: {
          id: true, number: true, title: true,
          subtitle: true, duration: true, category: true,
        },
      }),
      // Gallery (7)
      prisma.galleryItem.findMany({
        take: 7,
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      }),
    ])

  return { featuredArtist, artists, blogPosts, episodes, galleryItems }
}

export default async function HomePage() {
  const { featuredArtist, artists, blogPosts, episodes, galleryItems } =
    await getData()

  const featuredPost =
    blogPosts.find(p => p.featured) ?? blogPosts[0] ?? null
  const restPosts = featuredPost
    ? blogPosts.filter(p => p.id !== featuredPost.id)
    : []

  return (
    <main>
      {/* ── HERO ── */}
      <Hero featuredArtist={featuredArtist} />

      {/* ── ARTISTS ── */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className="si">
          <div className="hdr-row">
            <div>
              <div className="sl">Featured Artists</div>
              <h2 className="st">The <em>Voices</em></h2>
            </div>
            <Link href="/artists" className="btn-g">View All →</Link>
          </div>
          <div className={styles.artistGrid}>
            {artists.map((a, i) => (
              <ArtistCard
                key={a.id}
                name={a.name}
                slug={a.slug}
                genre={a.genre}
                location={a.location}
                monthlyListeners={a.monthlyListeners}
                profileImageUrl={a.profileImageUrl}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOG ── */}
      <section className={styles.section}>
        <div className="si">
          <div className="hdr-row">
            <div>
              <div className="sl">Latest Stories</div>
              <h2 className="st">From the <em>Press Room</em></h2>
            </div>
            <Link href="/blog" className="btn-g">All Posts →</Link>
          </div>
          <div className={styles.blogGrid}>
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className={`${styles.blogCard} ${styles.feat}`}>
                <div
                  className={`${styles.bcImg} ${!featuredPost.coverImageUrl ? styles.bcImgPlaceholder : ''}`}
                  style={
                    featuredPost.coverImageUrl
                      ? { backgroundImage: `url(${getCoverUrl(featuredPost.coverImageUrl, 'hero')})` }
                      : undefined
                  }
                />
                <div className={styles.bcN}>01</div>
                <div className={styles.bcCat}>{featuredPost.category}</div>
                <h3 className={styles.bcTitle}>{featuredPost.title}</h3>
                {featuredPost.excerpt && (
                  <p className={styles.bcExc}>{featuredPost.excerpt}</p>
                )}
                <div className={styles.bcFoot}>
                  <span>{featuredPost.publishedAt?.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} · {featuredPost.readingTime} min</span>
                  <span className={styles.bcRm}>Read More →</span>
                </div>
              </Link>
            )}
            {restPosts.map((post, i) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogCard}>
                <div
                  className={`${styles.bcImg} ${!post.coverImageUrl ? styles.bcImgPlaceholder : ''}`}
                  style={
                    post.coverImageUrl
                      ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'card')})` }
                      : undefined
                  }
                />
                <div className={styles.bcN}>0{i + 2}</div>
                <div className={styles.bcCat}>{post.category}</div>
                <h3 className={styles.bcTitle}>{post.title}</h3>
                {post.excerpt && <p className={styles.bcExc}>{post.excerpt}</p>}
                <div className={styles.bcFoot}>
                  <span>{post.publishedAt?.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                  <span className={styles.bcRm}>Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── EPISODES ── */}
      <section className={`${styles.section} ${styles.alt}`}>
        <div className="si">
          <div className="hdr-row">
            <div>
              <div className="sl">The Podcast</div>
              <h2 className="st">Latest <em>Episodes</em></h2>
            </div>
            <Link href="/episodes" className="btn-g">All Episodes →</Link>
          </div>
          <div className={styles.epList}>
            {episodes.map(ep => (
              <Link key={ep.id} href={`/episodes/${ep.id}`} className={styles.epRow}>
                <div className={styles.epN}>{ep.number}</div>
                <div className={styles.epInfo}>
                  <div className={styles.epT}>{ep.title}</div>
                  <div className={styles.epS}>{ep.subtitle}</div>
                </div>
                <div className={styles.epD}>{ep.duration}</div>
                <button className={styles.epBtn} aria-label="Play">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className={styles.section}>
        <div className="si">
          <div className="hdr-row">
            <div>
              <div className="sl">Visual Archive</div>
              <h2 className="st">The <em>Gallery</em></h2>
            </div>
            <Link href="/gallery" className="btn-g">Full Archive →</Link>
          </div>
          <div className={styles.galleryGrid}>
            {galleryItems.map((item, i) => (
              <div key={item.id} className={styles.gi}>
                <div
                  className={styles.gf}
                  style={{ backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                <div className={styles.go}>
                  <div className={styles.gIcon}>+</div>
                </div>
                <div className={styles.gLbl}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <NewsletterSignup variant="banner" />

      {/* ── NOW PLAYING ── */}
      <NowPlaying artist={
        featuredArtist ? {
          name: featuredArtist.name,
          streamSource: featuredArtist.streamSource,
          spotifyTrackId: featuredArtist.spotifyTrackId,
          youtubeVideoId: featuredArtist.youtubeVideoId,
          soundcloudUrl: featuredArtist.soundcloudUrl,
          customAudioUrl: featuredArtist.customAudioUrl,
        } : null
      } />
    </main>
  )
}
