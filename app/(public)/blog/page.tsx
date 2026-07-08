// app/(public)/blog/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import styles from './blog.module.css'
import { buildMetadata } from '@/lib/seo'
import { getCoverUrl } from '@/lib/images'

export const metadata = buildMetadata({
  title: 'Blog — Afroqueens FM',
  description: 'Long reads, artist profiles, event reviews and opinions that actually say something.',
  slug: 'blog',
})

export const revalidate = 60

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, title: true, slug: true, excerpt: true,
      category: true, author: true, publishedAt: true,
      readingTime: true, featured: true, coverImageUrl: true,
    },
  })

  const featuredPost =
    posts.find(p => p.featured) ?? posts[0] ?? null
  const restPosts = featuredPost
    ? posts.filter(p => p.id !== featuredPost.id)
    : []

  return (
    <main style={{ paddingTop: '100px' }}>
      <div className={styles.pageHero}>
        <div className={`si ${styles.heroInner}`}>
          <div className="sl">Editorial</div>
          <h1 className="st">The <em>Press Room</em></h1>
          <p className={styles.heroDesc}>
            Long reads, artist profiles, event reviews, and opinions that actually say something.
          </p>
        </div>
      </div>

      <div className="si" style={{ padding: '5rem 4rem' }}>
        {posts.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No stories published yet</p>
            <p className={styles.emptyDesc}>
              Check back soon — new editorial is on the way.
            </p>
          </div>
        )}

        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className={styles.featCard}>
            <div
              className={`${styles.featBg} ${!featuredPost.coverImageUrl ? styles.featBgPlaceholder : ''}`}
              style={
                featuredPost.coverImageUrl
                  ? { backgroundImage: `url(${getCoverUrl(featuredPost.coverImageUrl, 'hero')})` }
                  : undefined
              }
            />
            <div className={styles.featOverlay} />
            <div className={styles.featContent}>
              <div className={styles.cat}>{featuredPost.category}</div>
              <h2 className={styles.featTitle}>{featuredPost.title}</h2>
              {featuredPost.excerpt && (
                <p className={styles.featExc}>{featuredPost.excerpt}</p>
              )}
              <div className={styles.meta}>
                <span>{featuredPost.author}</span>
                <span className={styles.dot}>·</span>
                <span>
                  {featuredPost.publishedAt?.toLocaleDateString('en-GB', {
                    month: 'short', year: 'numeric',
                  })}
                </span>
                {featuredPost.readingTime && (
                  <>
                    <span className={styles.dot}>·</span>
                    <span>{featuredPost.readingTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </Link>
        )}

        {featuredPost && restPosts.length === 0 && (
          <p className={styles.gridNote}>More stories coming soon.</p>
        )}

        {restPosts.length > 0 && (
          <div className={styles.grid}>
            {restPosts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={styles.card}>
                <div
                  className={`${styles.cardImg} ${!post.coverImageUrl ? styles.cardImgPlaceholder : ''}`}
                  style={
                    post.coverImageUrl
                      ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'card')})` }
                      : undefined
                  }
                />
                <div className={styles.cardBody}>
                  <div className={styles.cat}>{post.category}</div>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  {post.excerpt && (
                    <p className={styles.cardExc}>{post.excerpt}</p>
                  )}
                  <div className={styles.cardFoot}>
                    <span>{post.publishedAt?.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
                    {post.readingTime && <span>{post.readingTime} min</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
