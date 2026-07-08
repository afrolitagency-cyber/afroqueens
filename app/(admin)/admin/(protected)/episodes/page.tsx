// app/(admin)/admin/episodes/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { deleteEpisode } from './actions'
import styles from '../shared.module.css'

export const revalidate = 0

const CAT_LABELS: Record<string, string> = {
  INTERVIEWS:        'Interviews',
  EVENT_COVERAGE:    'Event Coverage',
  DEEP_DIVES:        'Deep Dives',
  PANEL_DISCUSSIONS: 'Panel Discussions',
}

export default async function EpisodesPage() {
  const episodes = await prisma.episode.findMany({
    orderBy: [{ number: 'desc' }],
  })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Episodes</h1>
          <p className={styles.pageDesc}>{episodes.length} episode{episodes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/episodes/new" className={styles.newBtn}>+ New Episode</Link>
      </div>

      {episodes.length === 0 ? (
        <div className={styles.empty}>
          <p>No episodes yet.</p>
          <Link href="/admin/episodes/new" className={styles.newBtn}>Add First Episode</Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Category</th>
                <th>Duration</th>
                <th>Release Date</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map(ep => (
                <tr key={ep.id}>
                  <td style={{ color: 'var(--acc)', fontWeight: 600 }}>EP{String(ep.number).padStart(2, '0')}</td>
                  <td className={styles.tdMain}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{ep.title}</div>
                      {ep.subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--fg-dim)' }}>{ep.subtitle}</div>}
                    </div>
                  </td>
                  <td><span className={styles.badge}>{CAT_LABELS[ep.category] ?? ep.category}</span></td>
                  <td>{ep.duration}</td>
                  <td>{new Date(ep.releaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    {ep.featured
                      ? <span className={`${styles.badge} ${styles.badgeGreen}`}>★ Featured</span>
                      : <span className={styles.badge}>—</span>
                    }
                  </td>
                  <td className={styles.tdActions}>
                    <Link href={`/admin/episodes/${ep.id}/edit`} className={styles.editBtn}>Edit</Link>
                    <form action={async () => {
                      'use server'
                      await deleteEpisode(ep.id)
                    }} style={{ display: 'inline' }}>
                      <button type="submit" className={styles.deleteBtn}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
