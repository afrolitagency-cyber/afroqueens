'use client'
// app/(admin)/admin/artists/[id]/edit/page.tsx
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateArtist } from '../../actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import ArtistLinksFields from '@/components/admin/artists/ArtistLinksFields'
import styles from '../../artists.module.css'

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
  const [saveError, setSaveError]             = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/artists/${id}`)
      .then(r => r.json())
      .then(a => {
        setName(a.name ?? ''); setGenre(a.genre ?? ''); setLocation(a.location ?? '')
        setListeners(a.monthlyListeners ?? ''); setBio(a.bio ?? '')
        setProfileImageUrl(a.profileImageUrl ?? '')
        setStreamSource(a.streamSource ?? 'YOUTUBE')
        setSpotifyTrackId(a.spotifyTrackId ?? ''); setYoutubeVideoId(a.youtubeVideoId ?? '')
        setSoundcloudUrl(a.soundcloudUrl ?? ''); setCustomAudioUrl(a.customAudioUrl ?? '')
        setInstagramUrl(a.instagramUrl ?? ''); setTwitterUrl(a.twitterUrl ?? '')
        setTiktokUrl(a.tiktokUrl ?? ''); setFacebookUrl(a.facebookUrl ?? '')
        setReleaseUrl(a.releaseUrl ?? '')
        setFeatured(a.featured ?? false); setOrder(a.order ?? 0)
        setLoading(false)
      })
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

  if (loading) return <div className={styles.page}><p>Loading…</p></div>

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

      <div className={styles.formGrid}>
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
                <label className={styles.label}>YouTube Video ID</label>
                <input value={youtubeVideoId} onChange={e => setYoutubeVideoId(e.target.value)} className={styles.input} placeholder="dQw4w9WgXcQ" />
              </div>
            )}
            {streamSource === 'SPOTIFY' && (
              <div className={styles.sourceField}>
                <label className={styles.label}>Spotify Track ID</label>
                <input value={spotifyTrackId} onChange={e => setSpotifyTrackId(e.target.value)} className={styles.input} />
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
