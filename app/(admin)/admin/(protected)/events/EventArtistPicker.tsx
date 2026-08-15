'use client'

import { useEffect, useState } from 'react'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

type ArtistOption = { id: string; name: string }

interface Props {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export default function EventArtistPicker({ selectedIds, onChange }: Props) {
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/admin/artists')
      .then(async r => {
        if (!r.ok) throw new Error('Could not load artists')
        return r.json()
      })
      .then((data: ArtistOption[] | { artists?: ArtistOption[] }) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : data.artists ?? []
        setArtists(list.map(a => ({ id: a.id, name: a.name })))
      })
      .catch(err => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load artists')
      })
    return () => { cancelled = true }
  }, [])

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(existing => existing !== id)
        : [...selectedIds, id],
    )
  }

  return (
    <div>
      <label className={styles.label}>Performing artists</label>
      <div style={{ fontSize: '.75rem', color: '#888', margin: '.2rem 0 .55rem' }}>
        Tag artists so this event appears under Upcoming Events on their pages.
      </div>
      {loadError && (
        <div style={{ color: '#C8102E', fontSize: '.8rem', marginBottom: '.4rem' }}>{loadError}</div>
      )}
      {artists.length === 0 && !loadError ? (
        <div style={{ fontSize: '.8rem', color: '#888' }}>No artists yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: '.35rem', maxHeight: 220, overflow: 'auto', padding: '.15rem 0' }}>
          {artists.map(artist => (
            <label key={artist.id} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={selectedIds.includes(artist.id)}
                onChange={() => toggle(artist.id)}
              />
              {artist.name}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
