'use client'

import { useState, useTransition } from 'react'
import {
  createArtistRelease,
  deleteArtistRelease,
  updateArtistRelease,
  type ArtistReleasePayload,
} from '@/app/(admin)/admin/(protected)/artists/actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import styles from '@/app/(admin)/admin/(protected)/artists/artists.module.css'

type ReleaseType = 'ALBUM' | 'EP' | 'SINGLE'

interface ReleaseTrack {
  id?: string
  number: number
  title: string
  featuredArtists: string
  duration: string
  explicit: boolean
  listenUrl: string
}

export interface EditableRelease {
  id: string
  title: string
  type: ReleaseType
  year: number
  label: string | null
  description: string | null
  coverUrl: string | null
  listenUrl: string | null
  order: number
  tracks: Array<{
    id: string
    number: number
    title: string
    featuredArtists: string | null
    duration: string | null
    explicit: boolean
    listenUrl: string | null
  }>
}

interface Props {
  artistId: string
  initialReleases: EditableRelease[]
}

const blankTrack = (number = 1): ReleaseTrack => ({
  number,
  title: '',
  featuredArtists: '',
  duration: '',
  explicit: false,
  listenUrl: '',
})

const blankRelease = (): ArtistReleasePayload => ({
  title: '',
  type: 'SINGLE',
  year: new Date().getFullYear(),
  label: '',
  description: '',
  coverUrl: '',
  listenUrl: '',
  order: 0,
  tracks: [blankTrack()],
})

function toDraft(release: EditableRelease): ArtistReleasePayload {
  return {
    title: release.title,
    type: release.type,
    year: release.year,
    label: release.label ?? '',
    description: release.description ?? '',
    coverUrl: release.coverUrl ?? '',
    listenUrl: release.listenUrl ?? '',
    order: release.order,
    tracks: release.tracks.map(track => ({
      number: track.number,
      title: track.title,
      featuredArtists: track.featuredArtists ?? '',
      duration: track.duration ?? '',
      explicit: track.explicit,
      listenUrl: track.listenUrl ?? '',
    })),
  }
}

export default function ArtistDiscographyEditor({ artistId, initialReleases }: Props) {
  const [releases, setReleases] = useState(initialReleases)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<ArtistReleasePayload>(blankRelease)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const startNew = () => {
    setDraft({ ...blankRelease(), order: releases.length })
    setEditingId('new')
    setError(null)
  }

  const startEdit = (release: EditableRelease) => {
    setDraft(toDraft(release))
    setEditingId(release.id)
    setError(null)
  }

  const setTrack = (
    index: number,
    key: keyof ReleaseTrack,
    value: string | number | boolean,
  ) => {
    setDraft(current => ({
      ...current,
      tracks: current.tracks.map((track, i) =>
        i === index ? { ...track, [key]: value } : track,
      ),
    }))
  }

  const addTrack = () => {
    setDraft(current => ({
      ...current,
      tracks: [...current.tracks, blankTrack(current.tracks.length + 1)],
    }))
  }

  const removeTrack = (index: number) => {
    setDraft(current => ({
      ...current,
      tracks: current.tracks
        .filter((_, i) => i !== index)
        .map((track, i) => ({ ...track, number: i + 1 })),
    }))
  }

  const save = () => {
    setError(null)
    startTransition(async () => {
      const result = editingId === 'new'
        ? await createArtistRelease(artistId, draft)
        : await updateArtistRelease(editingId!, draft)

      if (!result.ok) {
        setError(result.error)
        return
      }

      window.location.reload()
    })
  }

  const removeRelease = (release: EditableRelease) => {
    if (!window.confirm(`Delete “${release.title}” and its tracks?`)) return
    setError(null)
    startTransition(async () => {
      const result = await deleteArtistRelease(release.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setReleases(current => current.filter(item => item.id !== release.id))
      if (editingId === release.id) setEditingId(null)
    })
  }

  return (
    <section className={styles.discAdmin}>
      <div className={styles.discAdminHeader}>
        <div>
          <div className={styles.streamLabel}>Discography</div>
          <p className={styles.streamHint}>Albums, EPs and singles shown on the public artist page.</p>
        </div>
        <button type="button" className={styles.addReleaseBtn} onClick={startNew}>
          + Add Release
        </button>
      </div>

      {error && <div className={styles.releaseError}>{error}</div>}

      {releases.length > 0 ? (
        <div className={styles.releaseAdminList}>
          {releases.map(release => (
            <div key={release.id} className={styles.releaseAdminRow}>
              <div
                className={styles.releaseAdminCover}
                style={release.coverUrl ? { backgroundImage: `url(${release.coverUrl})` } : undefined}
              >
                {!release.coverUrl && '♪'}
              </div>
              <div className={styles.releaseAdminInfo}>
                <strong>{release.title}</strong>
                <span>{release.type} · {release.year} · {release.tracks.length} track{release.tracks.length === 1 ? '' : 's'}</span>
              </div>
              <button type="button" className={styles.releaseEditBtn} onClick={() => startEdit(release)}>
                Edit
              </button>
              <button
                type="button"
                className={styles.releaseDeleteBtn}
                onClick={() => removeRelease(release)}
                disabled={isPending}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.releaseEmpty}>No releases yet. Add one to show the Discography section.</p>
      )}

      {editingId && (
        <div className={styles.releaseForm}>
          <div className={styles.releaseFormHeader}>
            <h3>{editingId === 'new' ? 'New Release' : 'Edit Release'}</h3>
            <button type="button" onClick={() => setEditingId(null)} aria-label="Close">✕</button>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Cover Artwork</label>
            <CloudinaryUpload
              folder="artists"
              value={draft.coverUrl ?? ''}
              onChange={coverUrl => setDraft(current => ({ ...current, coverUrl }))}
              label="Drop release artwork here or click to upload"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Release Title *</label>
              <input
                className={styles.input}
                value={draft.title}
                onChange={e => setDraft(current => ({ ...current, title: e.target.value }))}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Type</label>
              <select
                className={styles.select}
                value={draft.type}
                onChange={e => setDraft(current => ({ ...current, type: e.target.value as ReleaseType }))}
              >
                <option value="ALBUM">Album</option>
                <option value="EP">EP</option>
                <option value="SINGLE">Single</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Year *</label>
              <input
                type="number"
                min={1900}
                max={2100}
                className={styles.input}
                value={draft.year}
                onChange={e => setDraft(current => ({ ...current, year: Number(e.target.value) }))}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Label</label>
              <input
                className={styles.input}
                value={draft.label ?? ''}
                onChange={e => setDraft(current => ({ ...current, label: e.target.value }))}
                placeholder="Independent / Record label"
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={draft.description ?? ''}
              onChange={e => setDraft(current => ({ ...current, description: e.target.value }))}
              placeholder="Short note about this album, EP, or single…"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Listen URL</label>
              <input
                className={styles.input}
                value={draft.listenUrl ?? ''}
                onChange={e => setDraft(current => ({ ...current, listenUrl: e.target.value }))}
                placeholder="Spotify, Apple Music or smart link"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Display Order</label>
              <input
                type="number"
                min={0}
                className={styles.input}
                value={draft.order ?? 0}
                onChange={e => setDraft(current => ({ ...current, order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className={styles.trackEditor}>
            <div className={styles.trackEditorHeader}>
              <div>
                <span className={styles.label}>Tracklist *</span>
                <p>Add a listen URL to make a track title playable.</p>
              </div>
              <button type="button" onClick={addTrack}>+ Add Track</button>
            </div>

            {draft.tracks.map((track, index) => (
              <div key={index} className={styles.trackEditorRow}>
                <input
                  type="number"
                  min={1}
                  className={styles.trackNumberInput}
                  value={track.number}
                  onChange={e => setTrack(index, 'number', Number(e.target.value))}
                  aria-label="Track number"
                />
                <div className={styles.trackFields}>
                  <input
                    className={styles.input}
                    value={track.title}
                    onChange={e => setTrack(index, 'title', e.target.value)}
                    placeholder="Track title"
                  />
                  <div className={styles.trackMetaFields}>
                    <input
                      className={styles.input}
                      value={track.featuredArtists ?? ''}
                      onChange={e => setTrack(index, 'featuredArtists', e.target.value)}
                      placeholder="Featured artist"
                    />
                    <input
                      className={styles.input}
                      value={track.duration ?? ''}
                      onChange={e => setTrack(index, 'duration', e.target.value)}
                      placeholder="3:42"
                    />
                    <input
                      className={styles.input}
                      value={track.listenUrl ?? ''}
                      onChange={e => setTrack(index, 'listenUrl', e.target.value)}
                      placeholder="Track URL"
                    />
                  </div>
                </div>
                <label className={styles.explicitCheck}>
                  <input
                    type="checkbox"
                    checked={track.explicit ?? false}
                    onChange={e => setTrack(index, 'explicit', e.target.checked)}
                  />
                  E
                </label>
                <button
                  type="button"
                  className={styles.removeTrackBtn}
                  onClick={() => removeTrack(index)}
                  disabled={draft.tracks.length === 1}
                  aria-label="Remove track"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className={styles.releaseFormActions}>
            <button type="button" className={styles.releaseCancelBtn} onClick={() => setEditingId(null)}>
              Cancel
            </button>
            <button type="button" className={styles.saveBtn} onClick={save} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Release'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
