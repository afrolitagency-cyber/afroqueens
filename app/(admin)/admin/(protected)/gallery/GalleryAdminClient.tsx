'use client'
// app/(admin)/admin/gallery/GalleryAdminClient.tsx
import { useState, useTransition } from 'react'
import { createGalleryItem, deleteGalleryItem, updateGalleryItem } from './actions'
import styles from '../shared.module.css'
import { SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const CATEGORIES = [
  { value: 'LIVE_SESSIONS',      label: 'Live Sessions' },
  { value: 'STUDIO',             label: 'Studio' },
  { value: 'FESTIVALS',          label: 'Festivals' },
  { value: 'PORTRAITS',          label: 'Portraits' },
  { value: 'BEHIND_THE_SCENES',  label: 'Behind the Scenes' },
  { value: 'ON_THE_ROAD',        label: 'On the Road' },
]

interface GalleryItem {
  id: string; label: string; category: string
  imageUrl: string; featured: boolean; order: number
}

interface Props { initialItems: GalleryItem[] }

export default function GalleryAdminClient({ initialItems }: Props) {
  const [items, setItems]         = useState(initialItems)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTrans]   = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    setSaveError(null)

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'gallery')

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload to Cloudinary failed')
        const { url } = await res.json()

        const label = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

        const result = await createGalleryItem({
          label,
          category: 'LIVE_SESSIONS',
          imageUrl: url,
          featured: false,
          order: items.length,
        })

        if (!result.ok) {
          setSaveError(`${file.name}: uploaded to Cloudinary but could not save to database. ${result.error}`)
          continue
        }

        setItems(prev => [...prev, result.data as GalleryItem])
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Upload failed')
      }
    }
    setUploading(false)
  }

  const handleDelete = (id: string) => {
    setSaveError(null)
    startTrans(async () => {
      const result = await deleteGalleryItem(id)
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setItems(prev => prev.filter(i => i.id !== id))
    })
  }

  const handleToggleFeatured = (item: GalleryItem) => {
    setSaveError(null)
    startTrans(async () => {
      const result = await updateGalleryItem(item.id, { featured: !item.featured })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, featured: !i.featured } : i))
    })
  }

  const handleLabelChange = (id: string, label: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, label } : i))
  }

  const handleLabelBlur = (item: GalleryItem) => {
    setSaveError(null)
    startTrans(async () => {
      const result = await updateGalleryItem(item.id, { label: item.label })
      if (!result.ok) setSaveError(result.error)
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gallery</h1>
          <p className={styles.sub}>{items.length} items</p>
        </div>
      </div>

      <SaveErrorBanner error={saveError} onRetry={() => setSaveError(null)} />

      <div
        className={`${styles.dropzone} ${uploading ? styles.uploading : ''}`}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById('galleryInput')?.click()}
      >
        {uploading ? (
          <span className={styles.uploadText}>Uploading to Cloudinary…</span>
        ) : (
          <>
            <span className={styles.uploadIcon}>↑</span>
            <span className={styles.uploadText}>Drop images here or click to upload</span>
            <span className={styles.uploadSub}>PNG, JPG, WebP — bulk upload supported</span>
          </>
        )}
        <input
          id="galleryInput"
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      <div className={styles.grid}>
        {items.map(item => (
          <div key={item.id} className={styles.item}>
            <img src={item.imageUrl} alt={item.label} className={styles.img} />
            <div className={styles.itemMeta}>
              <input
                value={item.label}
                onChange={e => handleLabelChange(item.id, e.target.value)}
                onBlur={() => handleLabelBlur(item)}
                className={styles.labelInput}
                placeholder="Caption…"
              />
              <select
                value={item.category}
                onChange={e => {
                  const cat = e.target.value
                  setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: cat } : i))
                  startTrans(async () => {
                    const result = await updateGalleryItem(item.id, { category: cat as any })
                    if (!result.ok) setSaveError(result.error)
                  })
                }}
                className={styles.catSelect}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.itemActions}>
              <button
                onClick={() => handleToggleFeatured(item)}
                className={`${styles.featBtn} ${item.featured ? styles.featActive : ''}`}
                title="Toggle featured"
              >
                {item.featured ? '★' : '☆'}
              </button>
              <button onClick={() => handleDelete(item.id)} className={styles.delBtn} title="Delete">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
