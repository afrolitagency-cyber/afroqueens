'use client'
// components/admin/uploads/MediaLibraryPicker.tsx
import { useCallback, useEffect, useState } from 'react'
import { mediaDisplayName } from '@/lib/mediaAssetLabels'
import styles from './MediaLibrary.module.css'

export type MediaAssetRow = {
  id: string
  url: string
  publicId: string
  folder: string
  filename: string | null
  title?: string | null
  alt: string | null
  width: number | null
  height: number | null
  createdAt: string
}

interface Props {
  open: boolean
  folder?: string
  onClose: () => void
  onSelect: (url: string) => void
}

export default function MediaLibraryPicker({ open, folder, onClose, onSelect }: Props) {
  const [items, setItems] = useState<MediaAssetRow[]>([])
  const [q, setQ] = useState('')
  const [folderFilter, setFolderFilter] = useState(folder || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const load = useCallback(async (reset = true, cursor?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (folderFilter) params.set('folder', folderFilter)
      if (q.trim()) params.set('q', q.trim())
      params.set('take', '48')
      if (!reset && cursor) params.set('cursor', cursor)

      const res = await fetch(`/api/admin/media?${params}`)
      if (!res.ok) throw new Error('Failed to load media library')
      const data = await res.json()
      setItems(prev => (reset ? data.items : [...prev, ...data.items]))
      setNextCursor(data.nextCursor ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [folderFilter, q])

  useEffect(() => {
    if (!open) return
    setFolderFilter(folder || '')
    setQ('')
  }, [open, folder])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => { void load(true) }, 200)
    return () => window.clearTimeout(t)
  }, [open, load])

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Media library">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>Media library</div>
            <p className={styles.modalSub}>Choose an existing image or close and upload a new one.</p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.toolbar}>
          <input
            className={styles.search}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search filename, alt, URL…"
          />
          <select
            className={styles.select}
            value={folderFilter}
            onChange={e => setFolderFilter(e.target.value)}
          >
            <option value="">All folders</option>
            <option value="artists">Artists</option>
            <option value="blog">Blog</option>
            <option value="gallery">Gallery</option>
            <option value="episodes">Episodes</option>
            <option value="events">Events</option>
          </select>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              className={styles.card}
              onClick={() => {
                onSelect(item.url)
                onClose()
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt || mediaDisplayName(item)} className={styles.thumb} />
              <span className={styles.cardMeta}>
                {mediaDisplayName(item)}
              </span>
            </button>
          ))}
          {!loading && items.length === 0 && (
            <p className={styles.empty}>No media yet. Upload an image first.</p>
          )}
        </div>

        <div className={styles.modalFooter}>
          {loading && <span className={styles.muted}>Loading…</span>}
          {nextCursor && !loading && (
            <button type="button" className={styles.secondaryBtn} onClick={() => void load(false, nextCursor)}>
              Load more
            </button>
          )}
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
