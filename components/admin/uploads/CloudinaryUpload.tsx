'use client'
// components/admin/uploads/CloudinaryUpload.tsx
import { useRef, useState } from 'react'
import styles from './Upload.module.css'
import { deleteRemoteMedia } from './deleteRemoteMedia'

interface Props {
  folder: 'artists' | 'blog' | 'gallery' | 'episodes'
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function CloudinaryUpload({ folder, value, onChange, label }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError('')
    try {
      if (value) {
        try {
          await deleteRemoteMedia(value)
        } catch {
          // Continue with new upload even if old file delete fails
        }
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange(url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = async () => {
    if (!value) return
    setError('')
    try {
      await deleteRemoteMedia(value)
      onChange('')
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className={styles.wrap}>
      {value ? (
        <div className={styles.preview}>
          <img src={value} alt="Uploaded" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button type="button" onClick={() => inputRef.current?.click()} className={styles.changeBtn}>
              Change Image
            </button>
            <button type="button" onClick={handleRemove} className={styles.removeBtn}>Remove</button>
          </div>
        </div>
      ) : (
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
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
