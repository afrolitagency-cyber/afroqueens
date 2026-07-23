'use client'
// app/(admin)/admin/artists/new/page.tsx
import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createArtist } from '../actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import {
  loadFormDraft,
  saveFormDraft,
  clearFormDraft,
  FORM_DRAFT_KEYS,
} from '@/lib/formDraft'
import ArtistLinksFields from '@/components/admin/artists/ArtistLinksFields'
import styles from '../artists.module.css'

type ArtistDraft = {
  name: string
  genre: string
  location: string
  listeners: string
  bio: string
  profileImageUrl: string
  streamSource: 'SPOTIFY' | 'YOUTUBE' | 'SOUNDCLOUD' | 'CUSTOM'
  spotifyTrackId: string
  youtubeVideoId: string
  soundcloudUrl: string
  customAudioUrl: string
  instagramUrl: string
  twitterUrl: string
  tiktokUrl: string
  facebookUrl: string
  releaseUrl: string
  featured: boolean
  order: number
}

const DRAFT_KEY = FORM_DRAFT_KEYS.artistNew

export default function NewArtistPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName]                       = useState('')
  const [genre, setGenre]                     = useState('')
  const [location, setLocation]               = useState('')
  const [listeners, setListeners]             = useState('')
  const [bio, setBio]                         = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [streamSource, setStreamSource]       = useState<'SPOTIFY'|'YOUTUBE'|'SOUNDCLOUD'|'CUSTOM'>('YOUTUBE')
  const [spotifyTrackId, setSpotifyTrackId]   = useState('')
  const [youtubeVideoId, setYoutubeVideoId]   = useState('')
  const [soundcloudUrl, setSoundcloudUrl]     = useState('')
  const [customAudioUrl, setCustomAudioUrl]   = useState('')
  const [instagramUrl, setInstagramUrl]       = useState('')
  const [twitterUrl, setTwitterUrl]           = useState('')
  const [tiktokUrl, setTiktokUrl]             = useState('')
  const [facebookUrl, setFacebookUrl]         = useState('')
  const [releaseUrl, setReleaseUrl]           = useState('')
  const [featured, setFeatured]               = useState(false)
  const [order, setOrder]                     = useState(0)

  const [draftRestored, setDraftRestored] = useState(false)
  const [draftSavedAt, setDraftSavedAt]     = useState<string | null>(null)
  const [saveError, setSaveError]           = useState<string | null>(null)

  const getDraft = useCallback((): ArtistDraft => ({
    name, genre, location, listeners, bio, profileImageUrl,
    streamSource, spotifyTrackId, youtubeVideoId, soundcloudUrl,
    customAudioUrl, instagramUrl, twitterUrl, tiktokUrl, facebookUrl, releaseUrl,
    featured, order,
  }), [
    name, genre, location, listeners, bio, profileImageUrl,
    streamSource, spotifyTrackId, youtubeVideoId, soundcloudUrl,
    customAudioUrl, instagramUrl, twitterUrl, tiktokUrl, facebookUrl, releaseUrl,
    featured, order,
  ])

  // Restore draft on mount
  useEffect(() => {
    const draft = loadFormDraft<ArtistDraft & { _savedAt?: string }>(DRAFT_KEY)
    if (!draft) return

    setName(draft.name ?? '')
    setGenre(draft.genre ?? '')
    setLocation(draft.location ?? '')
    setListeners(draft.listeners ?? '')
    setBio(draft.bio ?? '')
    setProfileImageUrl(draft.profileImageUrl ?? '')
    setStreamSource(draft.streamSource ?? 'YOUTUBE')
    setSpotifyTrackId(draft.spotifyTrackId ?? '')
    setYoutubeVideoId(draft.youtubeVideoId ?? '')
    setSoundcloudUrl(draft.soundcloudUrl ?? '')
    setCustomAudioUrl(draft.customAudioUrl ?? '')
    setInstagramUrl(draft.instagramUrl ?? '')
    setTwitterUrl(draft.twitterUrl ?? '')
    setTiktokUrl(draft.tiktokUrl ?? '')
    setFacebookUrl(draft.facebookUrl ?? '')
    setReleaseUrl(draft.releaseUrl ?? '')
    setFeatured(draft.featured ?? false)
    setOrder(draft.order ?? 0)
    setDraftRestored(true)
    if (draft._savedAt) setDraftSavedAt(draft._savedAt)
  }, [])

  // Auto-save draft as user types (debounced)
  useEffect(() => {
    const hasContent = name || genre || location || bio || profileImageUrl || customAudioUrl
      || instagramUrl || twitterUrl || tiktokUrl || facebookUrl || releaseUrl
    if (!hasContent) return

    const timer = setTimeout(() => {
      saveFormDraft(DRAFT_KEY, getDraft())
      setDraftSavedAt(new Date().toISOString())
    }, 800)

    return () => clearTimeout(timer)
  }, [getDraft, name, genre, location, bio, profileImageUrl, customAudioUrl,
    instagramUrl, twitterUrl, tiktokUrl, facebookUrl, releaseUrl])

  const discardDraft = () => {
    clearFormDraft(DRAFT_KEY)
    setDraftRestored(false)
    setDraftSavedAt(null)
    setName('')
    setGenre('')
    setLocation('')
    setListeners('')
    setBio('')
    setProfileImageUrl('')
    setStreamSource('YOUTUBE')
    setSpotifyTrackId('')
    setYoutubeVideoId('')
    setSoundcloudUrl('')
    setCustomAudioUrl('')
    setInstagramUrl('')
    setTwitterUrl('')
    setTiktokUrl('')
    setFacebookUrl('')
    setReleaseUrl('')
    setFeatured(false)
    setOrder(0)
  }

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await createArtist({
        name, genre, location,
        monthlyListeners: listeners,
        bio,
        profileImageUrl,
        streamSource,
        spotifyTrackId,
        youtubeVideoId,
        soundcloudUrl,
        customAudioUrl,
        instagramUrl,
        twitterUrl,
        tiktokUrl,
        facebookUrl,
        releaseUrl,
        featured,
        order,
      })

      if (!result.ok) {
        setSaveError(result.error)
        saveFormDraft(DRAFT_KEY, getDraft())
        return
      }

      clearFormDraft(DRAFT_KEY)
      router.push('/admin/artists')
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.back}>← Back</button>
        <h1 className={styles.title}>New Artist</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Artist'}
        </button>
      </div>

      {draftRestored && (
        <div className={styles.draftBanner}>
          <span>Draft restored — your previous work is back, including uploaded image URLs.</span>
          <button type="button" className={styles.draftDismiss} onClick={() => setDraftRestored(false)}>
            Dismiss
          </button>
          <button type="button" className={styles.draftClear} onClick={discardDraft}>
            Clear draft
          </button>
        </div>
      )}

      {saveError && (
        <div className={styles.errorBanner}>
          <strong>Could not save.</strong> {saveError}
          <button type="button" className={styles.retryBtn} onClick={save} disabled={isPending}>
            Retry save
          </button>
        </div>
      )}

      {draftSavedAt && !saveError && (
        <p className={styles.draftHint}>
          Draft saved locally · {new Date(draftSavedAt).toLocaleTimeString()}
        </p>
      )}

      <div className={styles.formGrid}>
        {/* LEFT — main info */}
        <div className={styles.formMain}>
          {/* Profile photo */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Profile Photo</label>
            <CloudinaryUpload
              folder="artists"
              value={profileImageUrl}
              onChange={setProfileImageUrl}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Artist Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className={styles.input} placeholder="e.g. Zara Echo" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Genre *</label>
              <input value={genre} onChange={e => setGenre(e.target.value)} className={styles.input} placeholder="e.g. Afropop · R&B" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Location *</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className={styles.input} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Monthly Listeners</label>
              <input value={listeners} onChange={e => setListeners(e.target.value)} className={styles.input} placeholder="e.g. 1.3M" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className={styles.textarea} rows={4} placeholder="Artist biography…" />
          </div>

          {/* ── STREAM SOURCE ── */}
          <div className={styles.streamSection}>
            <div className={styles.streamLabel}>Music Source</div>
            <p className={styles.streamHint}>
              Choose where listeners hear this artist. All options are free.
            </p>

            <div className={styles.sourceTabs}>
              {(['YOUTUBE','SPOTIFY','SOUNDCLOUD','CUSTOM'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStreamSource(s)}
                  className={`${styles.sourceTab} ${streamSource === s ? styles.sourceActive : ''}`}
                >
                  {s === 'YOUTUBE'    && '▶ YouTube'}
                  {s === 'SPOTIFY'    && '♪ Spotify'}
                  {s === 'SOUNDCLOUD' && '☁ SoundCloud'}
                  {s === 'CUSTOM'     && '↑ Upload'}
                </button>
              ))}
            </div>

            {streamSource === 'YOUTUBE' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>YouTube URL or Video ID</label>
                <input
                  value={youtubeVideoId}
                  onChange={e => setYoutubeVideoId(e.target.value)}
                  className={styles.input}
                  placeholder="https://www.youtube.com/watch?v=… or dQw4w9WgXcQ"
                />
                <p className={styles.hint}>Paste a full YouTube link or just the video ID. Official audio videos work best.</p>
              </div>
            )}

            {streamSource === 'SPOTIFY' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>Spotify URL or Track ID</label>
                <input
                  value={spotifyTrackId}
                  onChange={e => setSpotifyTrackId(e.target.value)}
                  className={styles.input}
                  placeholder="https://open.spotify.com/track/… or track ID"
                />
                <p className={styles.hint}>30s preview free · full song for Spotify Premium users.</p>
              </div>
            )}

            {streamSource === 'SOUNDCLOUD' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>SoundCloud Track URL</label>
                <input
                  value={soundcloudUrl}
                  onChange={e => setSoundcloudUrl(e.target.value)}
                  className={styles.input}
                  placeholder="e.g. https://soundcloud.com/artist/track"
                />
                <p className={styles.hint}>Free for all public SoundCloud tracks.</p>
              </div>
            )}

            {streamSource === 'CUSTOM' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>Upload Artist Audio (MP3)</label>
                <SupabaseAudioUpload
                  folder="artists"
                  value={customAudioUrl}
                  onChange={setCustomAudioUrl}
                />
                <p className={styles.hint}>Artist must own the rights. Stored in Supabase Storage (free 1GB).</p>
              </div>
            )}
          </div>

          <ArtistLinksFields
            values={{ instagramUrl, twitterUrl, tiktokUrl, facebookUrl, releaseUrl }}
            onChange={(key, value) => {
              if (key === 'instagramUrl') setInstagramUrl(value)
              if (key === 'twitterUrl') setTwitterUrl(value)
              if (key === 'tiktokUrl') setTiktokUrl(value)
              if (key === 'facebookUrl') setFacebookUrl(value)
              if (key === 'releaseUrl') setReleaseUrl(value)
            }}
          />
        </div>

        {/* RIGHT — settings */}
        <div className={styles.formSide}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Settings</div>

            <div className={styles.fieldGroup}>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={e => setFeatured(e.target.checked)}
                />
                Featured artist (shown in hero + front of grids)
              </label>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Display Order</label>
              <input
                type="number"
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className={styles.input}
                min={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
