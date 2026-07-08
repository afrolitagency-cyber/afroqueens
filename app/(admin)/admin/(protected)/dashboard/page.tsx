// app/(admin)/admin/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import styles from './dashboard.module.css'

export default async function DashboardPage() {
  const [
    artistCount,
    blogTotal,
    blogPublished,
    blogDraft,
    episodeCount,
    galleryCount,
    pendingComments,
    unreadMessages,
    subscriberCount,
    latestPosts,
    latestArtists,
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: 'PUBLISHED' } }),
    prisma.blogPost.count({ where: { status: 'DRAFT' } }),
    prisma.episode.count(),
    prisma.galleryItem.count(),
    prisma.comment.count({ where: { status: 'PENDING' } }),
    prisma.contactSubmission.count({ where: { read: false } }),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
    prisma.blogPost.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, category: true, createdAt: true },
    }),
    prisma.artist.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, genre: true, featured: true, createdAt: true },
    }),
  ])

  const stats = [
    { label: 'Artists',           value: artistCount,       icon: '♪', href: '/admin/artists',    color: '#C8102E' },
    { label: 'Blog Posts',        value: blogTotal,         icon: '✎', href: '/admin/blogs',      color: '#2563eb' },
    { label: 'Published Posts',   value: blogPublished,     icon: '✓', href: '/admin/blogs',      color: '#16a34a' },
    { label: 'Drafts',            value: blogDraft,         icon: '◌', href: '/admin/blogs',      color: '#d97706' },
    { label: 'Episodes',          value: episodeCount,      icon: '◉', href: '/admin/episodes',   color: '#7c3aed' },
    { label: 'Gallery Items',     value: galleryCount,      icon: '⊡', href: '/admin/gallery',    color: '#0891b2' },
    { label: 'Pending Comments',  value: pendingComments,   icon: '💬', href: '/admin/comments',   color: '#ea580c' },
    { label: 'Unread Messages',   value: unreadMessages,    icon: '✉',  href: '/admin/inbox',      color: '#9333ea' },
    { label: 'Subscribers',       value: subscriberCount,   icon: '◎', href: '/admin/newsletter', color: '#0d9488' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Your Afroqueens content overview</p>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: s.color + '18', color: s.color }}>
              {s.icon}
            </div>
            <div className={styles.statVal}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className={styles.quickActions}>
        <div className={styles.sectionTitle}>Quick Actions</div>
        <div className={styles.actionRow}>
          <Link href="/admin/blogs/new"    className={styles.actionBtn}>✎ New Blog Post</Link>
          <Link href="/admin/artists/new"  className={styles.actionBtn}>♪ Add Artist</Link>
          <Link href="/admin/episodes/new" className={styles.actionBtn}>◉ New Episode</Link>
          <Link href="/admin/gallery"      className={styles.actionBtn}>⊡ Upload to Gallery</Link>
          <Link href="/admin/settings/theme" className={`${styles.actionBtn} ${styles.accentBtn}`}>◐ Change Theme</Link>
        </div>
      </div>

      <div className={styles.twoCol}>
        {/* Recent blog posts */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.sectionTitle}>Recent Posts</span>
            <Link href="/admin/blogs" className={styles.viewAll}>View all →</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestPosts.map(p => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/blogs/${p.id}`} className={styles.tableLink}>
                      {p.title.length > 40 ? p.title.slice(0, 40) + '…' : p.title}
                    </Link>
                  </td>
                  <td><span className={styles.cat}>{p.category}</span></td>
                  <td>
                    <span className={`${styles.badge} ${p.status === 'PUBLISHED' ? styles.pub : styles.draft}`}>
                      {p.status === 'PUBLISHED' ? 'Live' : 'Draft'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent artists */}
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.sectionTitle}>Recent Artists</span>
            <Link href="/admin/artists" className={styles.viewAll}>View all →</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Genre</th>
                <th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {latestArtists.map(a => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/artists/${a.id}`} className={styles.tableLink}>
                      {a.name}
                    </Link>
                  </td>
                  <td className={styles.dimText}>{a.genre}</td>
                  <td>
                    {a.featured && <span className={`${styles.badge} ${styles.featured}`}>★ Featured</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
