// components/admin/blogs/BlogAudienceFields.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export type BlogAudienceValue = 'SITE' | 'ARTIST'

type ArtistOption = { id: string; name: string }

interface Props {
  audience: BlogAudienceValue
  artistId: string
  onAudienceChange: (value: BlogAudienceValue) => void
  onArtistChange: (value: string) => void
}

export default function BlogAudienceFields({
  audience,
  artistId,
  onAudienceChange,
  onArtistChange,
}: Props) {
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

  return (
    <>
      <div className={styles.sideSection}>
        <div className={styles.sideLabel}>Show on</div>
        <select
          value={audience}
          onChange={e => {
            const next = e.target.value as BlogAudienceValue
            onAudienceChange(next)
            if (next === 'SITE') onArtistChange('')
          }}
          className={styles.sideSelect}
        >
          <option value="SITE">Main blog (Afroqueens news &amp; events)</option>
          <option value="ARTIST">Artist page only</option>
        </select>
        <div className={styles.charCount}>
          Artist posts stay off the main blog and homepage, but keep a shareable /blog link.
        </div>
      </div>

      {audience === 'ARTIST' && (
        <div className={styles.sideSection}>
          <div className={styles.sideLabel}>Artist *</div>
          <select
            value={artistId}
            onChange={e => onArtistChange(e.target.value)}
            className={styles.sideSelect}
          >
            <option value="">Select artist</option>
            {artists.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {loadError && (
            <div className={styles.charCount} style={{ color: '#C8102E' }}>{loadError}</div>
          )}
        </div>
      )}
    </>
  )
}
