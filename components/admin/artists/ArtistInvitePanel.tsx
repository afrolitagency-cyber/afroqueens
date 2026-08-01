'use client'
// components/admin/artists/ArtistInvitePanel.tsx
import { useState, useTransition } from 'react'
import {
  inviteArtist,
  approveArtistProfile,
  rejectArtistProfile,
} from '@/app/(admin)/admin/(protected)/artists/inviteActions'

interface Props {
  artistId: string
  artistName: string
  accountEmail: string | null
  reviewStatus: 'NONE' | 'DRAFT' | 'PENDING' | 'CHANGES_REQUESTED'
  pendingSummary?: string | null
  /** When true, skip Approve/Reject — handled by ArtistPendingReview */
  hideReviewActions?: boolean
}

export default function ArtistInvitePanel({
  artistId,
  artistName,
  accountEmail,
  reviewStatus,
  pendingSummary,
  hideReviewActions = false,
}: Props) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const sendInvite = () => {
    setError(null)
    setMessage(null)
    setInviteUrl(null)
    startTransition(async () => {
      const result = await inviteArtist(artistId, email)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setInviteUrl(result.inviteUrl)
      if (result.emailSent) {
        setMessage(`Invite sent to ${email.trim().toLowerCase()}.`)
      } else {
        setMessage(
          `Invite created, but email failed (${result.emailError ?? 'unknown'}). Copy the link below.`,
        )
      }
      setEmail('')
    })
  }

  const approve = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await approveArtistProfile(artistId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage('Pending profile approved and published.')
      window.location.reload()
    })
  }

  const reject = () => {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await rejectArtistProfile(artistId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage('Pending profile rejected.')
      window.location.reload()
    })
  }

  return (
    <section
      id="invite-artist"
      style={{
        marginBottom: '1.5rem',
        padding: '1.25rem 1.35rem',
        border: '2px solid #C8102E',
        borderRadius: 10,
        background: '#fff5f6',
        color: '#111',
      }}
    >
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#C8102E',
          marginBottom: '0.45rem',
        }}
      >
        Invite artist
      </div>
      <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#444', lineHeight: 1.55 }}>
        Send <strong style={{ color: '#111' }}>{artistName}</strong> a portal invite so they can
        edit their own profile. Their changes stay pending until you approve.
      </p>

      {accountEmail ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>
          Linked account: <strong>{accountEmail}</strong>
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#555',
                marginBottom: '0.35rem',
              }}
            >
              Invite email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="artist@email.com"
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                border: '1px solid #ddd',
                borderRadius: 8,
                background: '#fff',
                color: '#111',
                fontSize: '0.9rem',
              }}
            />
          </div>
          <button
            type="button"
            onClick={sendInvite}
            disabled={isPending || !email.trim()}
            style={{
              padding: '0.75rem 1.2rem',
              background: '#C8102E',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: isPending || !email.trim() ? 'not-allowed' : 'pointer',
              opacity: isPending || !email.trim() ? 0.55 : 1,
            }}
          >
            {isPending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      )}

      {reviewStatus === 'PENDING' && !hideReviewActions && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0c8ce' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#C8102E',
              marginBottom: '0.5rem',
            }}
          >
            Pending review
          </div>
          {pendingSummary && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.82rem', color: '#555' }}>
              {pendingSummary}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={approve}
              disabled={isPending}
              style={{
                padding: '0.55rem 1rem',
                background: '#C8102E',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
            <button
              type="button"
              onClick={reject}
              disabled={isPending}
              style={{
                padding: '0.55rem 1rem',
                background: '#fff',
                color: '#444',
                border: '1px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {reviewStatus === 'PENDING' && hideReviewActions && pendingSummary && (
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.82rem', color: '#555' }}>
          {pendingSummary} — use the review panel above to approve or request changes.
        </p>
      )}

      {reviewStatus === 'DRAFT' && (
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.82rem', color: '#666' }}>
          Artist has a saved draft (not submitted yet).
        </p>
      )}

      {message && (
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: '#166534' }}>{message}</p>
      )}
      {error && (
        <p style={{ margin: '0.85rem 0 0', fontSize: '0.85rem', color: '#C8102E' }}>{error}</p>
      )}
      {inviteUrl && (
        <div style={{ marginTop: '0.85rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#555',
              marginBottom: '0.35rem',
            }}
          >
            Invite link
          </label>
          <input
            readOnly
            value={inviteUrl}
            onFocus={e => e.target.select()}
            style={{
              width: '100%',
              padding: '0.7rem 0.9rem',
              border: '1px solid #ddd',
              borderRadius: 8,
              background: '#fff',
              color: '#111',
              fontSize: '0.85rem',
            }}
          />
        </div>
      )}
    </section>
  )
}
