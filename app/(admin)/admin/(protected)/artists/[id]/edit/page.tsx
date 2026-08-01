'use client'
// app/(admin)/admin/artists/[id]/edit/page.tsx
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateArtist } from '../../actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import ArtistLinksFields from '@/components/admin/artists/ArtistLinksFields'
import ArtistInvitePanel from '@/components/admin/artists/ArtistInvitePanel'
import ArtistPendingReview from '@/components/admin/artists/ArtistPendingReview'
import ArtistDiscographyEditor, {
  type EditableRelease,
} from '@/components/admin/artists/ArtistDiscographyEditor'
import type { ArtistProfileFields, StreamSourceValue } from '@/lib/artistProfile'
import { spotifyTrackUrl, youtubeWatchUrl } from '@/lib/mediaIds'
import styles from '@/app/(admin)/admin/(protected)/artists/artists.module.css'

function parsePendingProfile(raw: unknown): ArtistProfileFields | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parsePendingProfile(parsed)
    } catch {
      return null
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as ArtistProfileFields
}

function fieldStr(
  pending: ArtistProfileFields | null,
  live: string | null | undefined,
  key: keyof ArtistProfileFields,
): string {
  const fromPending = pending?.[key]
  if (typeof fromPending === 'string') return fromPending
  return live ?? ''
}

export default function EditArtistPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  const [name, setName]                       = useState('')
  const [genre, setGenre]                     = useState('')
  const [location, setLocation]               = useState('')
  const [listeners, setListeners]             = useState('')
  const [bio, setBio]                         = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [streamSource, setStreamSource]       = useState<StreamSourceValue>('YOUTUBE')
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
  const [releases, setReleases]               = useState<EditableRelease[]>([])
  const [saveError, setSaveError]             = useState<string | null>(null)
  const [accountEmail, setAccountEmail]       = useState<string | null>(null)
  const [reviewStatus, setReviewStatus]       = useState<'NONE' | 'DRAFT' | 'PENDING' | 'CHANGES_REQUESTED'>('NONE')
  const [pendingSummary, setPendingSummary]   = useState<string | null>(null)
  const [pendingProfile, setPendingProfile]   = useState<ArtistProfileFields | null>(null)
  const [reviewNote, setReviewNote]           = useState<string | null>(null)
  const [formEpoch, setFormEpoch]             = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/admin/artists/${id}`)
      .then(async r => {
        if (!r.ok) throw new Error(`Failed to load artist (${r.status})`)
        return r.json()
      })
      .then(a => {
        if (cancelled) return
        const pending = parsePendingProfile(a.pendingProfile)

        // Pending submission wins field-by-field (discography is live; profile music may only be pending)
        setName(fieldStr(pending, a.name, 'name'))
        setGenre(fieldStr(pending, a.genre, 'genre'))
        setLocation(fieldStr(pending, a.location, 'location'))
        setListeners(fieldStr(pending, a.monthlyListeners, 'monthlyListeners'))
        setBio(fieldStr(pending, a.bio, 'bio'))
        setProfileImageUrl(fieldStr(pending, a.profileImageUrl, 'profileImageUrl'))
        setStreamSource(
          (pending?.streamSource as StreamSourceValue | undefined) ??
            (a.streamSource as StreamSourceValue | undefined) ??
            'YOUTUBE',
        )
        setSpotifyTrackId(
          spotifyTrackUrl(fieldStr(pending, a.spotifyTrackId, 'spotifyTrackId'))
            ?? fieldStr(pending, a.spotifyTrackId, 'spotifyTrackId'),
        )
        setYoutubeVideoId(
          youtubeWatchUrl(fieldStr(pending, a.youtubeVideoId, 'youtubeVideoId'))
            ?? fieldStr(pending, a.youtubeVideoId, 'youtubeVideoId'),
        )
        setSoundcloudUrl(fieldStr(pending, a.soundcloudUrl, 'soundcloudUrl'))
        setCustomAudioUrl(fieldStr(pending, a.customAudioUrl, 'customAudioUrl'))
        setInstagramUrl(fieldStr(pending, a.instagramUrl, 'instagramUrl'))
        setTwitterUrl(fieldStr(pending, a.twitterUrl, 'twitterUrl'))
        setTiktokUrl(fieldStr(pending, a.tiktokUrl, 'tiktokUrl'))
        setFacebookUrl(fieldStr(pending, a.facebookUrl, 'facebookUrl'))
        setReleaseUrl(fieldStr(pending, a.releaseUrl, 'releaseUrl'))
        setFeatured(a.featured ?? false)
        setOrder(a.order ?? 0)
        setReleases(a.releases ?? [])
        setAccountEmail(a.account?.email ?? null)
        setReviewStatus(a.reviewStatus ?? 'NONE')
        setReviewNote(a.reviewNote ?? null)
        if (pending) {
          setPendingProfile(pending)
          setPendingSummary(
            `Submitted updates for ${pending.name ?? a.name}${pending.genre ? ` · ${pending.genre}` : ''}`,
          )
        } else {
          setPendingProfile(null)
          setPendingSummary(null)
        }
        setFormEpoch(e => e + 1)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setSaveError(err instanceof Error ? err.message : 'Failed to load artist')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateArtist(id, {
        name, genre, location,
        monthlyListeners: listeners,
        bio, profileImageUrl, streamSource,
        spotifyTrackId, youtubeVideoId, soundcloudUrl, customAudioUrl,
        instagramUrl, twitterUrl, tiktokUrl, facebookUrl, releaseUrl,
        featured, order,
      })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      router.push('/admin/artists')
    })
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.back}>← Back</button>
          <h1 className={styles.title}>Edit Artist</h1>
        </div>
        <ArtistInvitePanel
          artistId={id}
          artistName="this artist"
          accountEmail={null}
          reviewStatus="NONE"
        />
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.back}>← Back</button>
        <h1 className={styles.title}>Edit Artist</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {saveError && (
        <div className={styles.errorBanner}>
          <strong>Could not save.</strong> {saveError}
          <button type="button" className={styles.retryBtn} onClick={save} disabled={isPending}>
            Retry save
          </button>
        </div>
      )}

      {pendingProfile && (reviewStatus === 'PENDING' || reviewStatus === 'CHANGES_REQUESTED') && (
        <ArtistPendingReview
          artistId={id}
          pending={pendingProfile}
          reviewStatus={reviewStatus}
          reviewNote={reviewNote}
        />
      )}

      {pendingProfile && reviewStatus === 'PENDING' && (
        <p className={styles.hint} style={{ marginBottom: '1rem', color: '#555' }}>
          Photo, bio, and music below are from the artist’s pending submission (not live yet).
          Discography saves live immediately — that’s why releases can appear before you approve.
          Use <strong>Approve &amp; publish</strong> above to push the profile/music live.
        </p>
      )}

      <ArtistInvitePanel
        artistId={id}
        artistName={name || 'this artist'}
        accountEmail={accountEmail}
        reviewStatus={reviewStatus}
        pendingSummary={pendingSummary}
        hideReviewActions
      />

      <div className={styles.formGrid} key={formEpoch}>
        <div className={styles.formMain}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Profile Photo</label>
            <CloudinaryUpload folder="artists" value={profileImageUrl} onChange={setProfileImageUrl} />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Artist Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Genre *</label>
              <input value={genre} onChange={e => setGenre(e.target.value)} className={styles.input} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Location *</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Monthly Listeners</label>
              <input value={listeners} onChange={e => setListeners(e.target.value)} className={styles.input} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className={styles.textarea} rows={4} />
          </div>

          <div className={styles.streamSection}>
            <div className={styles.streamLabel}>Music Source</div>
            <div className={styles.sourceTabs}>
              {(['YOUTUBE','SPOTIFY','SOUNDCLOUD','CUSTOM'] as const).map(s => (
                <button key={s} onClick={() => setStreamSource(s)}
                  className={`${styles.sourceTab} ${streamSource === s ? styles.sourceActive : ''}`}>
                  {s === 'YOUTUBE' && '▶ YouTube'}{s === 'SPOTIFY' && '♪ Spotify'}
                  {s === 'SOUNDCLOUD' && '☁ SoundCloud'}{s === 'CUSTOM' && '↑ Upload'}
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
              </div>
            )}
            {streamSource === 'SOUNDCLOUD' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>SoundCloud Track URL</label>
                <input value={soundcloudUrl} onChange={e => setSoundcloudUrl(e.target.value)} className={styles.input} />
              </div>
            )}
            {streamSource === 'CUSTOM' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>Upload Artist Audio (MP3)</label>
                <SupabaseAudioUpload folder="artists" value={customAudioUrl} onChange={setCustomAudioUrl} />
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

          <ArtistDiscographyEditor artistId={id} initialReleases={releases} />
        </div>

        <div className={styles.formSide}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Settings</div>
            <div className={styles.fieldGroup}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                Featured artist
              </label>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Display Order</label>
              <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))} className={styles.input} min={0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
