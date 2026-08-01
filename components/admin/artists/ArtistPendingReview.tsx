'use client'
// components/admin/artists/ArtistPendingReview.tsx
import { useState, useTransition } from 'react'
import {
  approveArtistProfile,
  rejectArtistProfile,
  requestArtistChanges,
} from '@/app/(admin)/admin/(protected)/artists/inviteActions'
import type { ArtistProfileFields } from '@/lib/artistProfile'
import { spotifyTrackUrl, youtubeWatchUrl } from '@/lib/mediaIds'
import styles from '@/app/(admin)/admin/(protected)/artists/artists.module.css'

interface Props {
  artistId: string
  pending: ArtistProfileFields
  reviewStatus: 'PENDING' | 'CHANGES_REQUESTED' | 'DRAFT' | 'NONE'
  reviewNote?: string | null
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div className={styles.label}>{label}</div>
      <div style={{ color: '#222', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
        {value}
      </div>
    </div>
  )
}

function LinkRow({ label, href, text }: { label: string; href: string; text?: string }) {
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div className={styles.label}>{label}</div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#C8102E', fontSize: '0.9rem', lineHeight: 1.5, wordBreak: 'break-all' }}
      >
        {text ?? href}
      </a>
    </div>
  )
}

function musicDisplay(pending: ArtistProfileFields): { label: string; href?: string; text: string } | null {
  if (pending.streamSource === 'YOUTUBE' && pending.youtubeVideoId) {
    const href = youtubeWatchUrl(pending.youtubeVideoId) ?? pending.youtubeVideoId
    return { label: 'Music (YouTube)', href, text: href }
  }
  if (pending.streamSource === 'SPOTIFY' && pending.spotifyTrackId) {
    const href = spotifyTrackUrl(pending.spotifyTrackId) ?? pending.spotifyTrackId
    return { label: 'Music (Spotify)', href, text: href }
  }
  if (pending.streamSource === 'SOUNDCLOUD' && pending.soundcloudUrl) {
    return { label: 'Music (SoundCloud)', href: pending.soundcloudUrl, text: pending.soundcloudUrl }
  }
  if (pending.streamSource === 'CUSTOM' && pending.customAudioUrl) {
    return { label: 'Music (upload)', href: pending.customAudioUrl, text: pending.customAudioUrl }
  }
  if (pending.streamSource) {
    return { label: 'Music', text: pending.streamSource }
  }
  return null
}

export default function ArtistPendingReview({
  artistId,
  pending,
  reviewStatus,
  reviewNote,
}: Props) {
  const [note, setNote] = useState(reviewNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (reviewStatus !== 'PENDING' && reviewStatus !== 'CHANGES_REQUESTED') return null

  const run = (action: 'approve' | 'reject' | 'request') => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result =
        action === 'approve'
          ? await approveArtistProfile(artistId)
          : action === 'request'
            ? await requestArtistChanges(artistId, note)
            : await rejectArtistProfile(artistId, note)

      if (!result.ok) {
        setError(result.error)
        return
      }
      if (action === 'approve') {
        setMessage('Approved — artist profile is now live.')
      } else if (action === 'request') {
        const emailSent = 'emailSent' in (result.data ?? {}) ? result.data?.emailSent : true
        const emailError = result.data && 'emailError' in result.data ? result.data.emailError : undefined
        setMessage(
          emailSent
            ? 'Note saved and emailed to the artist.'
            : `Note saved in their portal, but email failed${emailError ? ` (${emailError})` : ''}. Ask them to check /artist.`,
        )
      } else {
        setMessage('Submission discarded.')
      }
      window.setTimeout(() => window.location.reload(), action === 'request' && result.data && !result.data.emailSent ? 2500 : 600)
    })
  }

  return (
    <section
      style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        border: '2px solid #C8102E',
        borderRadius: 10,
        background: '#fff8f8',
      }}
    >
      <div className={styles.sideTitle} style={{ color: '#C8102E', borderColor: 'rgba(200,16,46,.2)' }}>
        {reviewStatus === 'PENDING' ? 'Artist submission — awaiting review' : 'Changes requested — waiting on artist'}
      </div>
      <p className={styles.hint} style={{ color: '#555', marginBottom: '1rem' }}>
        Pending profile fields (photo, bio, music, links). Discography is live separately and does not need this approval.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        <div>
          {pending.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pending.profileImageUrl}
              alt={pending.name}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #e5e5e5',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 8,
                background: '#eee',
                display: 'grid',
                placeItems: 'center',
                color: '#888',
                fontSize: '0.8rem',
              }}
            >
              No photo
            </div>
          )}
        </div>
        <div>
          <Row label="Name" value={pending.name} />
          <Row label="Genre" value={pending.genre} />
          <Row label="Location" value={pending.location} />
          <Row label="Monthly listeners" value={pending.monthlyListeners} />
          <Row label="Bio" value={pending.bio} />
          {(() => {
            const music = musicDisplay(pending)
            if (!music) return null
            return music.href
              ? <LinkRow label={music.label} href={music.href} text={music.text} />
              : <Row label={music.label} value={music.text} />
          })()}
          <Row label="Instagram" value={pending.instagramUrl} />
          <Row label="X / Twitter" value={pending.twitterUrl} />
          <Row label="TikTok" value={pending.tiktokUrl} />
          <Row label="Facebook" value={pending.facebookUrl} />
          <Row label="Release link" value={pending.releaseUrl} />
        </div>
      </div>

      <div className={styles.fieldGroup} style={{ marginTop: '1.25rem' }}>
        <label className={styles.label}>Note to artist (emailed + shown in their portal)</label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Profile photo is blurry — please upload a clearer headshot. Also add Instagram."
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.85rem' }}>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={isPending}
          onClick={() => run('approve')}
        >
          {isPending ? 'Working…' : 'Approve & publish'}
        </button>
        <button
          type="button"
          className={styles.back}
          disabled={isPending || !note.trim()}
          onClick={() => run('request')}
          style={{ borderColor: '#C8102E', color: '#C8102E' }}
        >
          Request changes & email artist
        </button>
        <button
          type="button"
          className={styles.back}
          disabled={isPending}
          onClick={() => run('reject')}
        >
          Discard submission
        </button>
      </div>

      {error && <p className={styles.hint} style={{ color: '#C8102E', marginTop: '0.75rem' }}>{error}</p>}
      {message && <p className={styles.hint} style={{ color: '#166534', marginTop: '0.75rem' }}>{message}</p>}
    </section>
  )
}
