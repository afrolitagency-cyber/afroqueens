// app/(admin)/admin/blogs/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import styles from '../shared.module.css'
import BlogPostsTable from './BlogPostsTable'

export default async function AdminBlogsPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, slug: true, status: true,
      category: true, publishedAt: true, createdAt: true,
      featured: true, coverImageUrl: true,
    },
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Blog Posts</h1>
          <p className={styles.sub}>{posts.length} posts total</p>
        </div>
        <Link href="/admin/blogs/new" className={styles.addBtn}>
          + New Post
        </Link>
      </div>

      <div className={styles.tableWrap}>
        {posts.length > 0 ? (
          <BlogPostsTable posts={posts} />
        ) : (
          <div className={styles.empty}>
            No posts yet. <Link href="/admin/blogs/new">Create your first post →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
