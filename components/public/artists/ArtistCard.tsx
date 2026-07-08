'use client'
// components/public/artists/ArtistCard.tsx
import Link from 'next/link'
import styles from './ArtistCard.module.css'

interface ArtistCardProps {
  name: string
  slug: string
  genre: string | null
  location: string | null
  monthlyListeners?: string | null
  profileImageUrl?: string | null
  index?: number
}

export default function ArtistCard({
  name, slug, genre, location,
  monthlyListeners, profileImageUrl, index = 0,
}: ArtistCardProps) {
  const isPhoto = !!profileImageUrl

  const gradients = [
    'linear-gradient(160deg,#0a0a1c,#111130,#2a2a60)',
    'linear-gradient(160deg,#0a1c0a,#0d2e1a,#1a4530)',
    'linear-gradient(160deg,#1a1a0a,#2e2a0a,#4a3a10)',
    'linear-gradient(160deg,#1c0a0a,#3d1111,#7a2222)',
    'linear-gradient(160deg,#0a1a1c,#0d2e2e,#1a4545)',
  ]

  const bgStyle = isPhoto
    ? { backgroundImage: `url(${profileImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
    : { background: gradients[index % gradients.length] }

  return (
    <Link href={`/artists/${slug}`} className={styles.card}>
      <div className={styles.bg} style={bgStyle} />
      <div className={`${styles.overlay} ${isPhoto ? styles.photoOverlay : ''}`} />
      <div className={styles.info}>
        <div className={styles.genre}>{genre ?? ''}</div>
        <div className={styles.name}>{name}</div>
        <div className={styles.meta}>
          {location ?? ''}{monthlyListeners ? ` · ${monthlyListeners} Listeners` : ''}
        </div>
      </div>
    </Link>
  )
}
