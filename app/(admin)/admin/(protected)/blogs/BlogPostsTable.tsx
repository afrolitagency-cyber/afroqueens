'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteBlogPost } from './actions'
import { getCoverUrl } from '@/lib/images'
import styles from '../shared.module.css'

export type AdminBlogPost = {
  id: string
  title: string
  slug: string
  status: string
  category: string
  publishedAt: Date | null
  createdAt: Date
  featured: boolean
  coverImageUrl: string | null
}

export default function BlogPostsTable({ posts }: { posts: AdminBlogPost[] }) {
  const router = useRouter()

  const goToEdit = (id: string) => router.push(`/admin/blogs/${id}`)

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Cover</th>
          <th>Title</th>
          <th>Category</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {posts.map(post => (
          <tr
            key={post.id}
            className={styles.clickableRow}
            onClick={() => goToEdit(post.id)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                goToEdit(post.id)
              }
            }}
            tabIndex={0}
            role="link"
            aria-label={`Edit ${post.title}`}
          >
            <td>
              {post.coverImageUrl ? (
                <img
                  src={getCoverUrl(post.coverImageUrl, 'thumb')}
                  alt=""
                  className={styles.coverThumb}
                />
              ) : (
                <div className={styles.coverPlaceholder}>—</div>
              )}
            </td>
            <td>
              <div className={styles.postTitle}>
                {post.featured && <span className={styles.featBadge}>Featured</span>}
                {post.title}
              </div>
              <div className={styles.postSlug}>/{post.slug}</div>
            </td>
            <td><span className={styles.cat}>{post.category}</span></td>
            <td>
              <span className={`${styles.status} ${post.status === 'PUBLISHED' ? styles.pub : styles.draft}`}>
                {post.status === 'PUBLISHED' ? 'Published' : 'Draft'}
              </span>
            </td>
            <td className={styles.date}>
              {(post.publishedAt ?? post.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </td>
            <td onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
              <div className={styles.actions}>
                <Link href={`/blog/${post.slug}`} target="_blank" className={styles.actionBtn}>
                  View
                </Link>
                <form action={deleteBlogPost.bind(null, post.id)}>
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
  )
}
