'use client'
// app/(admin)/admin/(protected)/artists/invite/InviteArtistForm.tsx
import { useState, useTransition } from 'react'
import { createAndInviteArtist, inviteArtist, resendArtistInvite } from '../inviteActions'
import styles from '../../shared.module.css'
import artistStyles from '../artists.module.css'

type ArtistOption = {
  id: string
  name: string
}

type Mode = 'new' | 'existing'

export default function InviteArtistForm({
  artists,
  initialArtistId,
}: {
  artists: ArtistOption[]
  initialArtistId?: string
}) {
  const [mode, setMode] = useState<Mode>(initialArtistId ? 'existing' : 'new')
  const [artistId, setArtistId] = useState(initialArtistId ?? artists[0]?.id ?? '')
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('')
  const [location, setLocation] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [lastArtistId, setLastArtistId] = useState<string | null>(null)
  const [lastEmail, setLastEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const selected = artists.find(a => a.id === artistId)

  const applyInviteResult = (
    result: { ok: true; inviteUrl: string; emailSent: boolean; emailError?: string; artistId?: string },
    sentTo: string,
  ) => {
    setInviteUrl(result.inviteUrl)
    if (result.artistId) setLastArtistId(result.artistId)
    setLastEmail(sentTo)
    if (result.emailSent) {
      setMessage(`Invite sent to ${sentTo}.`)
      setError(null)
    } else {
      setMessage(null)
      setError(
        `Email failed (${result.emailError ?? 'unknown'}). Use the link below, or fix EMAIL_FROM / Resend domain and click Resend email.`,
      )
    }
  }

  const send = () => {
    setError(null)
    setMessage(null)
    setInviteUrl(null)
    setCopied(false)

    const sentTo = email.trim().toLowerCase()

    startTransition(async () => {
      const result = mode === 'new'
        ? await createAndInviteArtist({ name, email, genre, location })
        : await inviteArtist(artistId, email)

      if (!result.ok) {
        setError(result.error)
        return
      }

      if (mode === 'existing') setLastArtistId(artistId)
      applyInviteResult(result, sentTo)
      setEmail('')
      if (mode === 'new') {
        setName('')
        setGenre('')
        setLocation('')
      }
    })
  }

  const resend = () => {
    if (!lastArtistId) {
      setError('Send an invite first, then you can resend.')
      return
    }
    setError(null)
    setMessage(null)
    setCopied(false)
    startTransition(async () => {
      const result = await resendArtistInvite(lastArtistId, lastEmail ?? undefined)
      if (!result.ok) {
        setError(result.error)
        return
      }
      applyInviteResult(result, lastEmail ?? 'the artist')
    })
  }

  const copyLink = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
    } catch {
      setError('Could not copy — select the link and copy manually.')
    }
  }

  const canSend = mode === 'new'
    ? Boolean(name.trim() && email.trim())
    : Boolean(artistId && email.trim())

  return (
    <div style={{ maxWidth: 560 }}>
      <p className={artistStyles.hint} style={{ marginBottom: '1.25rem', color: '#555' }}>
        <strong style={{ color: '#111' }}>No account</strong> means the artist profile exists on the
        site, but they have not set up portal login yet. Invite creates that login link.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setMode('new')}
          className={mode === 'new' ? styles.newBtn : styles.secondaryBtn}
        >
          New artist
        </button>
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={mode === 'existing' ? styles.newBtn : styles.secondaryBtn}
          disabled={artists.length === 0}
        >
          Existing artist
        </button>
      </div>

      {mode === 'new' ? (
        <>
          <div className={artistStyles.fieldGroup} style={{ marginBottom: '1rem' }}>
            <label className={artistStyles.label}>Artist name *</label>
            <input
              className={artistStyles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ayra Starr"
            />
          </div>
          <div className={artistStyles.row} style={{ marginBottom: '1rem' }}>
            <div className={artistStyles.fieldGroup}>
              <label className={artistStyles.label}>Genre</label>
              <input
                className={artistStyles.input}
                value={genre}
                onChange={e => setGenre(e.target.value)}
                placeholder="Afrobeats"
              />
            </div>
            <div className={artistStyles.fieldGroup}>
              <label className={artistStyles.label}>Location</label>
              <input
                className={artistStyles.input}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Lagos, Nigeria"
              />
            </div>
          </div>
          <p className={artistStyles.hint} style={{ marginBottom: '1rem' }}>
            Creates their public profile and sends a portal invite in one step. They can fill in
            bio, photo, and music after they accept.
          </p>
        </>
      ) : artists.length === 0 ? (
        <p className={artistStyles.hint} style={{ marginBottom: '1rem' }}>
          No existing artists without an account. Use <strong>New artist</strong> instead.
        </p>
      ) : (
        <div className={artistStyles.fieldGroup} style={{ marginBottom: '1.25rem' }}>
          <label className={artistStyles.label}>Artist</label>
          <select
            className={artistStyles.select}
            value={artistId}
            onChange={e => setArtistId(e.target.value)}
          >
            {artists.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <p className={artistStyles.hint}>
            {selected
              ? `Invite ${selected.name} to manage the profile you already created.`
              : 'Pick an artist who does not have a portal account yet.'}
          </p>
        </div>
      )}

      <div className={artistStyles.fieldGroup} style={{ marginBottom: '1.25rem' }}>
        <label className={artistStyles.label}>Invite email *</label>
        <input
          type="email"
          className={artistStyles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="artist@email.com"
        />
      </div>

      <button
        type="button"
        className={styles.newBtn}
        onClick={send}
        disabled={isPending || !canSend}
      >
        {isPending
          ? 'Working…'
          : mode === 'new'
            ? 'Create profile & send invite'
            : 'Send invite'}
      </button>

      {message && (
        <p className={artistStyles.hint} style={{ marginTop: '1rem', color: '#166534' }}>
          {message}
        </p>
      )}
      {error && (
        <p className={artistStyles.hint} style={{ marginTop: '1rem', color: '#C8102E' }}>
          {error}
        </p>
      )}
      {inviteUrl && (
        <div className={artistStyles.fieldGroup} style={{ marginTop: '1rem' }}>
          <label className={artistStyles.label}>Invite link</label>
          <input
            readOnly
            className={artistStyles.input}
            value={inviteUrl}
            onFocus={e => e.target.select()}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.75rem' }}>
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.newBtn}
            >
              Open invite link
            </a>
            <button type="button" className={styles.secondaryBtn} onClick={copyLink}>
              {copied ? 'Copied' : 'Copy link'}
            </button>
            {lastArtistId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resend}
                disabled={isPending}
              >
                {isPending ? 'Sending…' : 'Resend email'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
