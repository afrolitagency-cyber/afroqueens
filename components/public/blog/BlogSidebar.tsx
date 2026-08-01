// components/public/blog/BlogSidebar.tsx
import Link from 'next/link'
import NewsletterSignup from '@/components/public/newsletter/NewsletterSignup'
import { getCoverUrl } from '@/lib/images'
import styles from './BlogSidebar.module.css'

export type SidebarPost = {
  id: string
  title: string
  slug: string
  category: string
  publishedAt: Date | null
  readingTime: number | null
  featured: boolean
  coverImageUrl: string | null
}

interface Props {
  title?: string
  posts: SidebarPost[]
  showNewsletter?: boolean
}

function formatDate(date: Date | null) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function BlogSidebar({
  title = 'You might also like',
  posts,
  showNewsletter = true,
}: Props) {
  if (posts.length === 0 && !showNewsletter) return null

  return (
    <aside className={styles.sidebar}>
      {posts.length > 0 && (
        <div className={styles.block}>
          <div className={styles.label}>{title}</div>
          <div className={styles.list}>
            {posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} className={styles.card}>
                <div
                  className={`${styles.thumb} ${!post.coverImageUrl ? styles.thumbPlaceholder : ''}`}
                  style={
                    post.coverImageUrl
                      ? { backgroundImage: `url(${getCoverUrl(post.coverImageUrl, 'thumb')})` }
                      : undefined
                  }
                />
                <div className={styles.body}>
                  <div className={styles.cat}>
                    {post.featured ? 'Pinned' : post.category}
                  </div>
                  <div className={styles.title}>{post.title}</div>
                  <div className={styles.meta}>
                    {formatDate(post.publishedAt)}
                    {post.readingTime ? ` · ${post.readingTime} min` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showNewsletter && (
        <div className={styles.newsWrap}>
          <NewsletterSignup variant="sidebar" />
        </div>
      )}
    </aside>
  )
}
