// app/(admin)/admin/widgets/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { deleteWidget, toggleWidget } from './actions'
import styles from '../shared.module.css'

export const revalidate = 0

const TYPE_LABELS: Record<string, string> = {
  YOUTUBE:    '▶ YouTube',
  SPOTIFY:    '♪ Spotify',
  SOUNDCLOUD: '☁ SoundCloud',
  APPLE_MUSIC:'♫ Apple Music',
  CUSTOM:     '⊞ Custom',
}

export default async function WidgetsPage() {
  const widgets = await prisma.widget.findMany({
    orderBy: [{ position: 'asc' }, { order: 'asc' }],
  })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Widget Panel</h1>
          <p className={styles.pageDesc}>
            Embed YouTube, Spotify, SoundCloud, or custom players.
            They dock left or right on desktop, bottom drawer on mobile.
          </p>
        </div>
        <Link href="/admin/widgets/new" className={styles.newBtn}>
          + Add Widget
        </Link>
      </div>

      {widgets.length === 0 ? (
        <div className={styles.empty}>
          <p>No widgets yet. Add one to show an embed panel on the site.</p>
          <Link href="/admin/widgets/new" className={styles.newBtn}>Add First Widget</Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Position</th>
                <th>Order</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {widgets.map(w => (
                <tr key={w.id}>
                  <td className={styles.tdMain}>{w.title}</td>
                  <td>
                    <span className={styles.badge}>{TYPE_LABELS[w.type] ?? w.type}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${w.position === 'LEFT' ? styles.badgeLeft : styles.badgeRight}`}>
                      {w.position}
                    </span>
                  </td>
                  <td>{w.order}</td>
                  <td>
                    <form action={async () => {
                      'use server'
                      await toggleWidget(w.id, !w.active)
                    }}>
                      <button
                        type="submit"
                        className={`${styles.toggleBtn} ${w.active ? styles.toggleOn : styles.toggleOff}`}
                      >
                        {w.active ? 'Live' : 'Off'}
                      </button>
                    </form>
                  </td>
                  <td className={styles.tdActions}>
                    <Link href={`/admin/widgets/${w.id}/edit`} className={styles.editBtn}>Edit</Link>
                    <form action={deleteWidget.bind(null, w.id)} style={{ display: 'inline' }}>
                      <button type="submit" className={styles.deleteBtn}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.infoBox}>
        <strong>How it works:</strong> Active widgets appear as a floating panel on all public pages.
        Multiple widgets on the same side stack — visitors switch between them with tabs.
        On mobile, the panel becomes a bottom drawer.
      </div>
    </div>
  )
}
