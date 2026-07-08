'use client'
// components/public/artists/ArtistsGrid.tsx
import { useState } from 'react'
import ArtistCard from './ArtistCard'
import styles from '@/app/(public)/artists/artists.module.css'

const GENRES = ['All Genres','Afrobeats','Afropop','Electronic','Highlife','Jazz','R&B','Amapiano']

interface Artist {
  id: string
  name: string
  slug: string
  genre: string | null
  location: string | null
  monthlyListeners: string | null
  profileImageUrl: string | null
}

export default function ArtistsGrid({ artists }: { artists: Artist[] }) {
  const [active, setActive] = useState('All Genres')

  const filtered = active === 'All Genres'
    ? artists
    : artists.filter(a => a.genre?.toLowerCase().includes(active.toLowerCase()))

  return (
    <>
      <div className={styles.filterBar}>
        {GENRES.map(f => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`${styles.filterBtn} ${active === f ? styles.active : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: '3rem 0', opacity: 0.5 }}>No artists found for "{active}".</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((a, i) => (
            <ArtistCard
              key={a.id}
              name={a.name}
              slug={a.slug}
              genre={a.genre}
              location={a.location}
              monthlyListeners={a.monthlyListeners}
              profileImageUrl={a.profileImageUrl}
              index={i}
            />
          ))}
        </div>
      )}
    </>
  )
}
