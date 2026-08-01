'use client'
// components/admin/uploads/CloudinaryUpload.tsx
import { useRef, useState } from 'react'
import styles from './Upload.module.css'
import libraryStyles from './MediaLibrary.module.css'
import MediaLibraryPicker from './MediaLibraryPicker'

interface Props {
  folder: 'artists' | 'blog' | 'gallery' | 'episodes' | 'events'
  value: string
  onChange: (url: string) => void
  label?: string
  /** Show “Choose from library” (admin only — hide on artist portal). */
  showLibrary?: boolean
}

export default function CloudinaryUpload({
  folder,
  value,
  onChange,
  label,
  showLibrary = true,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setError('')
    onChange('')
  }

  return (
    <div className={styles.wrap}>
      {value ? (
        <div className={styles.preview}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Uploaded" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button type="button" onClick={() => inputRef.current?.click()} className={styles.changeBtn}>
              Upload new
            </button>
            {showLibrary && (
              <button type="button" onClick={() => setLibraryOpen(true)} className={styles.changeBtn}>
                Library
              </button>
            )}
            <button type="button" onClick={handleRemove} className={styles.removeBtn}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`${styles.dropzone} ${uploading ? styles.uploading : ''}`}
            onDrop={onDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <span className={styles.uploadingText}>Uploading…</span>
            ) : (
              <>
                <span className={styles.icon}>↑</span>
                <span className={styles.dropText}>
                  {label ?? 'Drop image here or click to upload'}
                </span>
                <span className={styles.dropSub}>PNG, JPG, WebP — auto-optimised via Cloudinary</span>
              </>
            )}
          </div>
          {showLibrary && (
            <div className={libraryStyles.libraryActions}>
              <button
                type="button"
                className={libraryStyles.libraryBtn}
                onClick={() => setLibraryOpen(true)}
              >
                Choose from library
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className={styles.error}>{error}</p>}

      {showLibrary && (
        <MediaLibraryPicker
          open={libraryOpen}
          folder={folder}
          onClose={() => setLibraryOpen(false)}
          onSelect={onChange}
        />
      )}
    </div>
  )
}
