'use client'
// components/admin/uploads/SupabaseAudioUpload.tsx
import { useRef, useState } from 'react'
import styles from './Upload.module.css'
import { deleteRemoteMedia } from './deleteRemoteMedia'

interface Props {
  folder: 'artists' | 'episodes'
  value: string
  onChange: (url: string) => void
}

export default function SupabaseAudioUpload({ folder, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [error, setError]         = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an MP3 or audio file')
      return
    }
    setUploading(true)
    setError('')
    setProgress(0)

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

      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Audio upload failed')
      const { url } = await res.json()
      onChange(url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
      setProgress(100)
    }
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
        <div className={styles.audioPreview}>
          <audio controls src={value} className={styles.audioPlayer} />
          <div className={styles.previewActions}>
            <button type="button" onClick={() => inputRef.current?.click()} className={styles.changeBtn}>
              Replace Audio
            </button>
            <button type="button" onClick={handleRemove} className={styles.removeBtn}>Remove</button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${uploading ? styles.uploading : ''}`}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <span className={styles.uploadingText}>Uploading to Supabase…</span>
          ) : (
            <>
              <span className={styles.icon}>♪</span>
              <span className={styles.dropText}>Click to upload MP3 audio</span>
              <span className={styles.dropSub}>Stored in Supabase Storage (free 1GB)</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && <p className={styles.error}>{error}</p>}
    </div>
  )
}
