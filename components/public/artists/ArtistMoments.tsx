// components/public/artists/ArtistMoments.tsx
import { getCoverUrl } from '@/lib/images'
import styles from './ArtistMoments.module.css'

export type PublicMoment = {
  id: string
  imageUrl: string
  caption: string | null
  linkUrl: string | null
}

export default function ArtistMoments({
  artistName,
  moments,
}: {
  artistName: string
  moments: PublicMoment[]
}) {
  if (moments.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Moments</h2>
      <p className={styles.lead}>Stills and scenes from {artistName}&apos;s live world.</p>
      <div className={styles.grid}>
        {moments.map(moment => {
          const src = getCoverUrl(moment.imageUrl, 'card') || moment.imageUrl
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={moment.caption || `${artistName} moment`} className={styles.img} />
              {(moment.caption || moment.linkUrl) && (
                <div className={styles.meta}>
                  {moment.caption && <span className={styles.caption}>{moment.caption}</span>}
                  {moment.linkUrl && <span className={styles.linkHint}>Watch →</span>}
                </div>
              )}
            </>
          )

          if (moment.linkUrl) {
            return (
              <a
                key={moment.id}
                href={moment.linkUrl}
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            )
          }

          return (
            <div key={moment.id} className={styles.card}>
              {inner}
            </div>
          )
        })}
      </div>
    </section>
  )
}
