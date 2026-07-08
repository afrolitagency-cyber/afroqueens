// app/(admin)/admin/artists/page.tsx
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { deleteArtist } from './actions'
import styles from '../shared.module.css'

export const revalidate = 0

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Artists</h1>
          <p className={styles.pageDesc}>{artists.length} artist{artists.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/artists/new" className={styles.newBtn}>+ New Artist</Link>
      </div>

      {artists.length === 0 ? (
        <div className={styles.empty}>
          <p>No artists yet.</p>
          <Link href="/admin/artists/new" className={styles.newBtn}>Add First Artist</Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Artist</th>
                <th>Genre</th>
                <th>Location</th>
                <th>Listeners</th>
                <th>Source</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artists.map(a => (
                <tr key={a.id}>
                  <td className={styles.tdMain}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {a.profileImageUrl ? (
                        <Image
                          src={a.profileImageUrl}
                          alt={a.name}
                          width={36}
                          height={36}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'var(--acc-gl)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', color: 'var(--acc)',
                        }}>
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{a.name}</span>
                    </div>
                  </td>
                  <td><span className={styles.badge}>{a.genre}</span></td>
                  <td>{a.location}</td>
                  <td>{a.monthlyListeners ?? '—'}</td>
                  <td>
                    <span className={styles.badge}>
                      {a.streamSource === 'YOUTUBE'    && '▶ YouTube'}
                      {a.streamSource === 'SPOTIFY'    && '♪ Spotify'}
                      {a.streamSource === 'SOUNDCLOUD' && '☁ SoundCloud'}
                      {a.streamSource === 'CUSTOM'     && '↑ Upload'}
                    </span>
                  </td>
                  <td>
                    {a.featured
                      ? <span className={`${styles.badge} ${styles.badgeGreen}`}>★ Featured</span>
                      : <span className={styles.badge}>—</span>
                    }
                  </td>
                  <td className={styles.tdActions}>
                    <Link href={`/admin/artists/${a.id}/edit`} className={styles.editBtn}>Edit</Link>
                    <form action={async () => {
                      'use server'
                      await deleteArtist(a.id)
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
