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

function galleryBgPosition(cropPosition: 'TOP' | 'CENTER' | 'BOTTOM') {
  if (cropPosition === 'TOP') return 'center top'
  if (cropPosition === 'BOTTOM') return 'center bottom'
  return 'center'
}

async function getData() {
  const blogSelect = {
    id: true, title: true, slug: true,
    excerpt: true, category: true, publishedAt: true,
    readingTime: true, featured: true, coverImageUrl: true, author: true,
  } as const

  const [featuredArtist, artists, pinnedPosts, recentPosts, episodes, galleryItems] =
    await Promise.all([
      prisma.artist.findFirst({
        where: { featured: true },
        orderBy: { order: 'asc' },
      }),
      prisma.artist.findMany({
        take: 4,
        orderBy: { order: 'asc' },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', audience: 'SITE', featured: true },
        take: 3,
        orderBy: { publishedAt: 'desc' },
        select: blogSelect,
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED', audience: 'SITE' },
        take: 8,
        orderBy: { publishedAt: 'desc' },
        select: blogSelect,
      }),
      prisma.episode.findMany({
        take: 4,
        orderBy: { number: 'desc' },
        select: {
          id: true, number: true, title: true,
          subtitle: true, duration: true, category: true,
        },
      }),
      prisma.galleryItem.findMany({
        take: 7,
        orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      }),
    ])

  return { featuredArtist, artists, pinnedPosts, recentPosts, episodes, galleryItems }
}

function formatPostDate(date: Date | null) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function HomePage() {
  const { featuredArtist, artists, pinnedPosts, recentPosts, episodes, galleryItems } =
    await getData()

  const featuredGrid = [
    ...pinnedPosts,
    ...recentPosts.filter(post => !pinnedPosts.some(pinned => pinned.id === post.id)),
  ].slice(0, 3)
  const [mainFeature, ...sideFeatures] = featuredGrid
  const listPosts = recentPosts
    .filter(post => !featuredGrid.some(featured => featured.id === post.id))
    .slice(0, 3)

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
              <div className="sl">From the Blog</div>
              <h2 className="st">Stories worth <em>reading</em></h2>
            </div>
            <Link href="/blog" className="btn-g">All Posts →</Link>
          </div>

          {mainFeature && (
            <div className={styles.featuredGrid}>
              <Link
                href={`/blog/${mainFeature.slug}`}
                className={`${styles.featureCard} ${styles.featureMain}`}
              >
                <div
                  className={`${styles.featureImg} ${!mainFeature.coverImageUrl ? styles.featureImgPlaceholder : ''}`}
                  style={
                    mainFeature.coverImageUrl
                      ? { backgroundImage: `url(${getCoverUrl(mainFeature.coverImageUrl, 'hero')})` }
                      : undefined
                  }
                />
                <div className={styles.featureOverlay} />
                {mainFeature.featured && <span className={styles.pinBadge}>Pinned</span>}
                <div className={styles.featureBody}>
                  <span className={styles.featureCat}>{mainFeature.category}</span>
                  <h3 className={styles.featureTitle}>{mainFeature.title}</h3>
                  {mainFeature.excerpt && (
                    <p className={styles.featureExcerpt}>{mainFeature.excerpt}</p>
                  )}
                  <div className={styles.featureMeta}>
                    <span>{mainFeature.author}</span>
                    <span>·</span>
                    <span>{formatPostDate(mainFeature.publishedAt)}</span>
                    {mainFeature.readingTime ? (
                      <>
                        <span>·</span>
                        <span>{mainFeature.readingTime} min read</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </Link>

              {sideFeatures.map(post => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`${styles.featureCard} ${styles.featureSide}`}
                >
                  <div
                    className={`${styles.featureImg} ${!post.coverImageUrl ? styles.featureImgPlaceholder : ''}`}
                    style={
                      post.coverImageUrl
                        ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'card')})` }
                        : undefined
                    }
                  />
                  <div className={styles.featureOverlay} />
                  {post.featured && <span className={styles.pinBadge}>Pinned</span>}
                  <div className={styles.featureBody}>
                    <span className={styles.featureCat}>{post.category}</span>
                    <h3 className={styles.featureTitle}>{post.title}</h3>
                    <div className={styles.featureMeta}>
                      <span>{formatPostDate(post.publishedAt)}</span>
                      {post.readingTime ? (
                        <>
                          <span>·</span>
                          <span>{post.readingTime} min read</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {listPosts.length > 0 && (
            <div className={styles.blogListRow}>
              {listPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className={styles.blogListCard}>
                  <div
                    className={`${styles.blogListThumb} ${!post.coverImageUrl ? styles.featureImgPlaceholder : ''}`}
                    style={
                      post.coverImageUrl
                        ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'thumb')})` }
                        : undefined
                    }
                  />
                  <div className={styles.blogListBody}>
                    <div className={styles.blogListCat}>{post.category}</div>
                    <div className={styles.blogListTitle}>{post.title}</div>
                    <div className={styles.blogListMeta}>
                      {formatPostDate(post.publishedAt)}
                      {post.readingTime ? ` · ${post.readingTime} min` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
                  style={{
                    backgroundImage: `url(${item.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: galleryBgPosition(item.cropPosition),
                  }}
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
