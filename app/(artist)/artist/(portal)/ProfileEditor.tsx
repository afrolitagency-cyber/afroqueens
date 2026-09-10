'use client'
// app/(artist)/artist/(portal)/ProfileEditor.tsx
import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import ArtistLinksFields from '@/components/admin/artists/ArtistLinksFields'
import {
  saveArtistDraft,
  submitArtistProfile,
  createMyRelease,
  updateMyRelease,
  deleteMyRelease,
  type ArtistProfileFields,
  type StreamSourceValue,
} from './actions'
import ArtistDiscographyEditor, {
  type EditableRelease,
} from '@/components/admin/artists/ArtistDiscographyEditor'
import styles from '../artist.module.css'

interface Props {
  initial: ArtistProfileFields
  reviewStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'CHANGES_REQUESTED'
  reviewNote?: string | null
  publicSlug: string
  artistId: string
  releases: EditableRelease[]
}

export default function ProfileEditor({
  initial,
  reviewStatus,
  reviewNote,
  publicSlug,
  artistId,
  releases,
}: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ArtistProfileFields>(initial)
  const formRef = useRef(form)
  formRef.current = form
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const skipAutosave = useRef(true)

  const set = <K extends keyof ArtistProfileFields>(key: K, value: ArtistProfileFields[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const hasOpenSubmission =
    reviewStatus === 'PENDING' || reviewStatus === 'CHANGES_REQUESTED'

  // Keep profile (including links) on the server so a discography reload can't wipe them
  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void saveArtistDraft(formRef.current)
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [form])

  const persistProfileDraft = async (): Promise<string | null> => {
    const result = await saveArtistDraft(formRef.current)
    return result.ok ? null : result.error
  }

  const run = (mode: 'draft' | 'submit') => {
    setError(null)
    setOk(null)
    startTransition(async () => {
      const result = mode === 'draft'
        ? await saveArtistDraft(form)
        : await submitArtistProfile(form)
      if (!result.ok) {
        setError(result.error)
        return
      }
      const updated = result.data?.updated
      if (mode === 'draft') {
        setOk(
          updated
            ? 'Saved — your open review was updated (same request, not a new one).'
            : 'Draft saved. Submit when you’re ready for review.',
        )
      } else {
        setOk(
          updated
            ? 'Submission updated. Editors still see the same review request with your latest changes.'
            : 'Submitted for review. An editor will publish your updates.',
        )
      }
      router.refresh()
    })
  }

  const statusLabel =
    reviewStatus === 'PENDING' ? 'Awaiting review'
      : reviewStatus === 'CHANGES_REQUESTED' ? 'Changes requested'
      : reviewStatus === 'DRAFT' ? 'Draft saved'
        : 'Live profile'

  return (
    <>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>Your page</div>
        <h1 className={styles.title}>Edit profile</h1>
        <p className={styles.sub}>
          Update your photo, bio, music, and links. You have one review request —
          further saves update that same submission until an editor approves.
        </p>
        <div
          className={`${styles.status} ${
            reviewStatus === 'PENDING' || reviewStatus === 'CHANGES_REQUESTED'
              ? styles.statusPending
              : reviewStatus === 'DRAFT'
                ? styles.statusDraft
                : ''
          }`}
        >
          {statusLabel}
          <a href={`/artists/${publicSlug}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            · View public page
          </a>
        </div>
      </div>

      {error && <div className={styles.banner}>{error}</div>}
      {ok && <div className={`${styles.banner} ${styles.bannerOk}`}>{ok}</div>}
      {reviewStatus === 'CHANGES_REQUESTED' && reviewNote && (
        <div className={styles.banner}>
          <strong>Editor feedback:</strong> {reviewNote}
        </div>
      )}

      <section className={`${styles.card} ${styles.blend}`}>
        <div className={styles.cardTitle}>Basics</div>
        <div className={styles.field}>
          <label className={styles.label}>Cover / banner</label>
          <CloudinaryUpload
            folder="artists"
            value={form.coverImageUrl ?? ''}
            onChange={url => set('coverImageUrl', url || null)}
            showLibrary={false}
          />
          <p className={styles.sub} style={{ margin: '0.35rem 0 0', fontSize: '0.78rem' }}>
            Wide image for your page background — different from your profile photo.
          </p>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Profile photo *</label>
          <CloudinaryUpload
            folder="artists"
            value={form.profileImageUrl ?? ''}
            onChange={url => set('profileImageUrl', url || null)}
            showLibrary={false}
          />
          <p className={styles.sub} style={{ margin: '0.35rem 0 0', fontSize: '0.78rem' }}>
            Required for review. Use a clear, well-lit portrait.
          </p>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Artist name *</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Genre *</label>
            <input
              className={styles.input}
              value={form.genre}
              onChange={e => set('genre', e.target.value)}
            />
          </div>
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Location *</label>
            <input
              className={styles.input}
              value={form.location}
              onChange={e => set('location', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Monthly listeners</label>
            <input
              className={styles.input}
              value={form.monthlyListeners ?? ''}
              onChange={e => set('monthlyListeners', e.target.value || null)}
              placeholder="e.g. 1.3M"
            />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Bio *</label>
          <textarea
            className={styles.textarea}
            value={form.bio ?? ''}
            onChange={e => set('bio', e.target.value || null)}
            rows={5}
          />
        </div>
      </section>

      <section className={`${styles.card} ${styles.blend}`}>
        <div className={styles.cardTitle}>Music *</div>
        <div className={styles.tabs}>
          {(['YOUTUBE', 'SPOTIFY', 'SOUNDCLOUD', 'CUSTOM'] as StreamSourceValue[]).map(s => (
            <button
              key={s}
              type="button"
              className={`${styles.tab} ${form.streamSource === s ? styles.tabActive : ''}`}
              onClick={() => set('streamSource', s)}
            >
              {s === 'YOUTUBE' && 'YouTube'}
              {s === 'SPOTIFY' && 'Spotify'}
              {s === 'SOUNDCLOUD' && 'SoundCloud'}
              {s === 'CUSTOM' && 'Upload'}
            </button>
          ))}
        </div>
        {form.streamSource === 'YOUTUBE' && (
          <div className={styles.field}>
            <label className={styles.label}>YouTube URL or video ID</label>
            <input
              className={styles.input}
              value={form.youtubeVideoId ?? ''}
              onChange={e => set('youtubeVideoId', e.target.value || null)}
            />
          </div>
        )}
        {form.streamSource === 'SPOTIFY' && (
          <div className={styles.field}>
            <label className={styles.label}>Spotify URL or track ID</label>
            <input
              className={styles.input}
              value={form.spotifyTrackId ?? ''}
              onChange={e => set('spotifyTrackId', e.target.value || null)}
            />
          </div>
        )}
        {form.streamSource === 'SOUNDCLOUD' && (
          <div className={styles.field}>
            <label className={styles.label}>SoundCloud track URL</label>
            <input
              className={styles.input}
              value={form.soundcloudUrl ?? ''}
              onChange={e => set('soundcloudUrl', e.target.value || null)}
            />
          </div>
        )}
        {form.streamSource === 'CUSTOM' && (
          <div className={styles.field}>
            <label className={styles.label}>Upload audio (MP3)</label>
            <SupabaseAudioUpload
              folder="artists"
              value={form.customAudioUrl ?? ''}
              onChange={url => set('customAudioUrl', url || null)}
            />
          </div>
        )}
      </section>

      <section className={`${styles.card} ${styles.blend}`}>
        <div className={styles.cardTitle}>Links</div>
        <p className={styles.sub} style={{ marginTop: 0, marginBottom: '0.85rem', fontSize: '0.82rem' }}>
          Auto-saved as you type. Still click <strong>Update submission</strong> when you’re done so the editor is notified.
        </p>
        <ArtistLinksFields
          values={{
            instagramUrl: form.instagramUrl ?? '',
            twitterUrl: form.twitterUrl ?? '',
            tiktokUrl: form.tiktokUrl ?? '',
            facebookUrl: form.facebookUrl ?? '',
            releaseUrl: form.releaseUrl ?? '',
          }}
          onChange={(key, value) => set(key, value || null)}
        />
      </section>

      <section className={`${styles.card} ${styles.blend}`}>
        <ArtistDiscographyEditor
          artistId={artistId}
          initialReleases={releases}
          beforeSave={persistProfileDraft}
          showLibrary={false}
          actions={{
            create: createMyRelease,
            update: updateMyRelease,
            remove: deleteMyRelease,
          }}
          hint="Updates go live on your public page immediately. Your profile fields are saved first so links aren’t lost."
        />
      </section>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={isPending}
          onClick={() => run('draft')}
        >
          {isPending ? 'Saving…' : hasOpenSubmission ? 'Save updates' : 'Save draft'}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={isPending}
          onClick={() => run('submit')}
        >
          {isPending
            ? hasOpenSubmission ? 'Updating…' : 'Submitting…'
            : hasOpenSubmission
              ? 'Update submission'
              : 'Submit for review'}
        </button>
      </div>
    </>
  )
}
