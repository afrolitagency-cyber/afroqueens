'use client'
// components/admin/artists/ArtistMomentsEditor.tsx
import { useState, useTransition } from 'react'
import {
  createArtistMoment,
  deleteArtistMoment,
  updateArtistMoment,
  type ArtistMomentPayload,
} from '@/app/(admin)/admin/(protected)/artists/actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import styles from '@/app/(admin)/admin/(protected)/artists/artists.module.css'

export type EditableMoment = {
  id: string
  imageUrl: string
  caption: string | null
  linkUrl: string | null
  order: number
}

interface Props {
  artistId: string
  initialMoments: EditableMoment[]
}

const blank = (): ArtistMomentPayload & { id?: string } => ({
  imageUrl: '',
  caption: '',
  linkUrl: '',
  order: 0,
})

export default function ArtistMomentsEditor({ artistId, initialMoments }: Props) {
  const [moments, setMoments] = useState(initialMoments)
  const [draft, setDraft] = useState(blank())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const startEdit = (m: EditableMoment) => {
    setEditingId(m.id)
    setDraft({
      imageUrl: m.imageUrl,
      caption: m.caption ?? '',
      linkUrl: m.linkUrl ?? '',
      order: m.order,
    })
    setError(null)
  }

  const cancel = () => {
    setEditingId(null)
    setDraft(blank())
    setError(null)
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const payload: ArtistMomentPayload = {
        imageUrl: draft.imageUrl,
        caption: draft.caption,
        linkUrl: draft.linkUrl,
        order: Number(draft.order) || 0,
      }
      const result = editingId
        ? await updateArtistMoment(editingId, payload)
        : await createArtistMoment(artistId, payload)

      if (!result.ok) {
        setError(result.error)
        return
      }

      // Refresh list from server state via soft reload of moments
      const res = await fetch(`/api/admin/artists/${artistId}`)
      if (res.ok) {
        const artist = await res.json()
        setMoments(artist.moments ?? [])
      }
      cancel()
    })
  }

  const remove = (id: string) => {
    if (!confirm('Delete this moment?')) return
    setError(null)
    startTransition(async () => {
      const result = await deleteArtistMoment(id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMoments(prev => prev.filter(m => m.id !== id))
      if (editingId === id) cancel()
    })
  }

  return (
    <div className={styles.streamSection} style={{ marginTop: '1.5rem' }}>
      <div className={styles.streamLabel}>Moments</div>
      <p className={styles.hint} style={{ marginBottom: '1rem' }}>
        Event stills and promo photos for the artist page. Images only for now — optional Instagram
        / TikTok link per photo if you want “Watch on Instagram”.
      </p>

      {moments.length === 0 ? (
        <p className={styles.hint} style={{ marginBottom: '1rem' }}>No moments yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {moments.map(m => (
            <div key={m.id} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.imageUrl} alt={m.caption || 'Moment'} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '0.45rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button type="button" className={styles.releaseEditBtn} onClick={() => startEdit(m)}>
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.releaseDeleteBtn}
                  onClick={() => remove(m.id)}
                  disabled={isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', display: 'grid', gap: '0.85rem' }}>
        <div className={styles.streamLabel} style={{ marginBottom: 0 }}>
          {editingId ? 'Edit moment' : 'Add moment'}
        </div>
        <CloudinaryUpload
          folder="artists"
          value={draft.imageUrl}
          onChange={url => setDraft(d => ({ ...d, imageUrl: url }))}
          label="Drop moment photo or click to upload"
        />
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Caption (optional)</label>
          <input
            className={styles.input}
            value={draft.caption ?? ''}
            onChange={e => setDraft(d => ({ ...d, caption: e.target.value }))}
            placeholder="e.g. Lust & Luxury Block Party"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>External link (optional)</label>
          <input
            className={styles.input}
            value={draft.linkUrl ?? ''}
            onChange={e => setDraft(d => ({ ...d, linkUrl: e.target.value }))}
            placeholder="instagram.com/reel/… or tiktok.com/@…"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Order</label>
          <input
            type="number"
            className={styles.input}
            value={draft.order ?? 0}
            onChange={e => setDraft(d => ({ ...d, order: Number(e.target.value) }))}
            min={0}
          />
        </div>
        {error && <p style={{ color: '#C8102E', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.addReleaseBtn}
            onClick={save}
            disabled={isPending || !draft.imageUrl}
            style={{ opacity: isPending || !draft.imageUrl ? 0.55 : 1 }}
          >
            {isPending ? 'Saving…' : editingId ? 'Update moment' : 'Add moment'}
          </button>
          {editingId && (
            <button type="button" className={styles.releaseCancelBtn} onClick={cancel} disabled={isPending}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
