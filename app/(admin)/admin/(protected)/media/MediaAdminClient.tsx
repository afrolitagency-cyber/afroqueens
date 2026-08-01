'use client'
// app/(admin)/admin/(protected)/media/MediaAdminClient.tsx
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  deleteMediaAsset,
  syncMediaFromContent,
  updateMediaDetails,
} from './actions'
import { mediaDisplayName, mediaFileLabel } from '@/lib/mediaAssetLabels'
import styles from '@/components/admin/uploads/MediaLibrary.module.css'

export type MediaAssetDTO = {
  id: string
  url: string
  publicId: string
  folder: string
  filename: string | null
  title: string | null
  alt: string | null
  caption: string | null
  width: number | null
  height: number | null
  bytes: number | null
  mimeType: string | null
  uploadedBy: string | null
  createdAt: string | Date
}

interface Props {
  initialItems: MediaAssetDTO[]
}

function formatBytes(n: number | null) {
  if (!n) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function folderLabel(folder: string) {
  return folder.charAt(0).toUpperCase() + folder.slice(1)
}

export default function MediaAdminClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [folder, setFolder] = useState('')
  const [q, setQ] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', alt: '', caption: '' })
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (folder && item.folder !== folder) return false
      if (!q.trim()) return true
      const hay = `${mediaDisplayName(item)} ${item.filename ?? ''} ${item.alt ?? ''} ${item.caption ?? ''} ${item.url}`.toLowerCase()
      return hay.includes(q.trim().toLowerCase())
    })
  }, [items, folder, q])

  const activeIndex = filtered.findIndex(item => item.id === activeId)
  const active = activeIndex >= 0 ? filtered[activeIndex] : null

  useEffect(() => {
    if (!active) return
    setDraft({
      title: active.title ?? mediaDisplayName(active),
      alt: active.alt ?? '',
      caption: active.caption ?? '',
    })
  }, [active?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null)
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [activeId, activeIndex, filtered.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const go = (delta: number) => {
    if (!filtered.length) return
    const next = (activeIndex + delta + filtered.length) % filtered.length
    setActiveId(filtered[next].id)
  }

  const openDetails = (id: string) => setActiveId(id)

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    setMessage(null)
    try {
      const targetFolder = folder || 'blog'
      const created: MediaAssetDTO[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', targetFolder)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`Upload failed for ${file.name}`)
        const data = await res.json()
        const title = file.name.replace(/\.[^.]+$/, '')
        created.push({
          id: data.assetId,
          url: data.url,
          publicId: data.publicId,
          folder: targetFolder,
          filename: file.name,
          title,
          alt: null,
          caption: null,
          width: null,
          height: null,
          bytes: file.size,
          mimeType: file.type || null,
          uploadedBy: null,
          createdAt: new Date().toISOString(),
        })
      }
      setItems(prev => [...created, ...prev])
      setMessage(`Uploaded ${created.length} image${created.length === 1 ? '' : 's'}.`)
      if (created[0]) setActiveId(created[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const saveDetails = () => {
    if (!active) return
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await updateMediaDetails(active.id, draft)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setItems(prev =>
        prev.map(item =>
          item.id === active.id
            ? {
                ...item,
                title: draft.title.trim() || null,
                alt: draft.alt.trim() || null,
                caption: draft.caption.trim() || null,
              }
            : item,
        ),
      )
      setMessage('Details saved.')
    })
  }

  const remove = () => {
    if (!active) return
    if (!window.confirm('Delete this image permanently from the library and Cloudinary?')) return
    setError(null)
    setMessage(null)
    const id = active.id
    startTransition(async () => {
      const result = await deleteMediaAsset(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const remaining = filtered.filter(item => item.id !== id)
      setItems(prev => prev.filter(item => item.id !== id))
      setActiveId(remaining[0]?.id ?? null)
      setMessage('Image deleted.')
    })
  }

  const copyUrl = async () => {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.url)
      setMessage('URL copied to clipboard.')
    } catch {
      setError('Could not copy URL.')
    }
  }

  const sync = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await syncMediaFromContent()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(
        `Synced: ${result.data.created} added, ${result.data.titled} titled, ${result.data.skipped} unchanged.`,
      )
      window.location.reload()
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Media Library</h1>
          <p className={styles.sub}>
            Click an image for attachment details — edit title, alt text, copy URL, or delete.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryBtn} onClick={sync} disabled={isPending}>
            {isPending ? 'Working…' : 'Import from content'}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Uploading…' : 'Upload images'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={e => void uploadFiles(e.target.files)}
          />
        </div>
      </div>

      {message && <div className={styles.banner}>{message}</div>}
      {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}

      <div className={styles.filterBar}>
        <input
          className={styles.search}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search…"
        />
        <select className={styles.select} value={folder} onChange={e => setFolder(e.target.value)}>
          <option value="">All folders</option>
          <option value="artists">Artists</option>
          <option value="blog">Blog</option>
          <option value="gallery">Gallery</option>
          <option value="episodes">Episodes</option>
          <option value="events">Events</option>
        </select>
      </div>

      <div className={styles.adminGrid}>
        {filtered.map(item => (
          <button
            key={item.id}
            type="button"
            className={styles.adminCardBtn}
            onClick={() => openDetails(item.id)}
          >
            <div className={styles.mediaFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt || mediaDisplayName(item)}
                className={styles.adminThumb}
              />
            </div>
            <div className={styles.adminBody}>
              <div className={styles.adminName}>{mediaDisplayName(item)}</div>
              <div className={styles.adminMeta}>{formatDate(item.createdAt)}</div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className={styles.empty}>No media yet. Upload images or import from existing content.</p>
      )}

      {active && (
        <div
          className={styles.detailsOverlay}
          onClick={e => {
            if (e.target === e.currentTarget) setActiveId(null)
          }}
        >
          <div className={styles.detailsModal} role="dialog" aria-modal="true" aria-label="Attachment details">
            <div className={styles.detailsTop}>
              <h2 className={styles.detailsHeading}>Attachment details</h2>
              <div className={styles.detailsTopActions}>
                <button
                  type="button"
                  className={styles.navIconBtn}
                  aria-label="Previous"
                  disabled={filtered.length < 2}
                  onClick={() => go(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.navIconBtn}
                  aria-label="Next"
                  disabled={filtered.length < 2}
                  onClick={() => go(1)}
                >
                  ›
                </button>
                <button
                  type="button"
                  className={styles.navIconBtn}
                  aria-label="Close"
                  onClick={() => setActiveId(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className={styles.detailsBody}>
              <div className={styles.detailsPreview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.url}
                  alt={draft.alt || mediaDisplayName(active)}
                  className={styles.detailsImage}
                />
                <div className={styles.detailsPreviewActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => void copyUrl()}>
                    Copy URL to clipboard
                  </button>
                  <a
                    className={styles.secondaryBtn}
                    href={active.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View media file
                  </a>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    disabled={isPending}
                    onClick={remove}
                  >
                    Delete permanently
                  </button>
                </div>
              </div>

              <div className={styles.detailsSide}>
                <dl className={styles.metaList}>
                  <div>
                    <dt>Uploaded on</dt>
                    <dd>{formatDate(active.createdAt)}</dd>
                  </div>
                  {active.uploadedBy && (
                    <div>
                      <dt>Uploaded by</dt>
                      <dd>{active.uploadedBy}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Uploaded to</dt>
                    <dd>{folderLabel(active.folder)}</dd>
                  </div>
                  <div>
                    <dt>File name</dt>
                    <dd>{mediaFileLabel(active)}</dd>
                  </div>
                  <div>
                    <dt>File type</dt>
                    <dd>{active.mimeType || 'image'}</dd>
                  </div>
                  <div>
                    <dt>File size</dt>
                    <dd>{formatBytes(active.bytes)}</dd>
                  </div>
                  <div>
                    <dt>Dimensions</dt>
                    <dd>
                      {active.width && active.height
                        ? `${active.width} by ${active.height} pixels`
                        : '—'}
                    </dd>
                  </div>
                </dl>

                <label className={styles.fieldLabel}>
                  Title
                  <input
                    className={styles.fieldInput}
                    value={draft.title}
                    onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  Alternative text
                  <textarea
                    className={styles.fieldTextarea}
                    rows={3}
                    value={draft.alt}
                    onChange={e => setDraft(d => ({ ...d, alt: e.target.value }))}
                    placeholder="Describe the purpose of the image"
                  />
                </label>

                <label className={styles.fieldLabel}>
                  Caption
                  <textarea
                    className={styles.fieldTextarea}
                    rows={2}
                    value={draft.caption}
                    onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  File URL
                  <input className={styles.fieldInput} value={active.url} readOnly onFocus={e => e.target.select()} />
                </label>

                <div className={styles.detailsSideActions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    disabled={isPending}
                    onClick={saveDetails}
                  >
                    {isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
