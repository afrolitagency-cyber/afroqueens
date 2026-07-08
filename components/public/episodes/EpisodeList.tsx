'use client'
// components/public/episodes/EpisodeList.tsx
import { useState } from 'react'
import styles from './EpisodeList.module.css'

interface Episode {
  id: string
  number: number
  title: string
  subtitle?: string | null
  duration: string
  releaseDate: Date
  category: string
  audioUrl?: string | null
  featured: boolean
}

interface Props { episodes: Episode[] }

const FILTERS = [
  { value: 'ALL',               label: 'All Episodes' },
  { value: 'INTERVIEWS',        label: 'Interviews' },
  { value: 'EVENT_COVERAGE',    label: 'Event Coverage' },
  { value: 'DEEP_DIVES',        label: 'Deep Dives' },
  { value: 'PANEL_DISCUSSIONS', label: 'Panels' },
]

export default function EpisodeList({ episodes }: Props) {
  const [active, setActive] = useState('ALL')
  const [playing, setPlaying] = useState<string | null>(null)

  const filtered = active === 'ALL'
    ? episodes
    : episodes.filter(e => e.category === active)

  return (
    <>
      {/* Filter tabs */}
      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`${styles.filterBtn} ${active === f.value ? styles.active : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Episode rows */}
      <div className={styles.list}>
        {filtered.map(ep => (
          <div key={ep.id} className={styles.row}>
            <div className={styles.num}>{ep.number}</div>

            <div className={styles.info}>
              <div className={styles.title}>{ep.title}</div>
              {ep.subtitle && (
                <div className={styles.sub}>{ep.subtitle}</div>
              )}
            </div>

            <div className={styles.dur}>{ep.duration}</div>

            <button
              className={`${styles.playBtn} ${playing === ep.id ? styles.playing : ''}`}
              onClick={() => setPlaying(playing === ep.id ? null : ep.id)}
              aria-label={playing === ep.id ? 'Pause' : 'Play'}
            >
              {playing === ep.id ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Hidden audio player - shown when playing */}
            {playing === ep.id && ep.audioUrl && (
              <audio
                autoPlay
                src={ep.audioUrl}
                onEnded={() => setPlaying(null)}
                style={{ display: 'none' }}
              />
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className={styles.empty}>No episodes in this category yet.</div>
        )}
      </div>
    </>
  )
}
