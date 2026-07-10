'use client'

import { useState } from 'react'
import styles from './event-register.module.css'

export default function EventRegisterForm({
  eventId,
  eventSlug,
  eventTitle,
}: {
  eventId: string
  eventSlug: string
  eventTitle: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, eventId, eventSlug }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setStatus('ok')
      setMessage(data.message || `You're registered for ${eventTitle}.`)
      setName('')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  if (status === 'ok') {
    return (
      <div className={styles.success}>
        <strong>You&apos;re registered</strong>
        <p>{message}</p>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h2 className={styles.formTitle}>Register for this event</h2>
      <p className={styles.formHint}>
        We&apos;ll email you a confirmation and updates about this event.
      </p>
      <label className={styles.label}>
        Name
        <input
          className={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </label>
      <label className={styles.label}>
        Email
        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
        />
      </label>
      {status === 'error' && <p className={styles.error}>{message}</p>}
      <button className={styles.btn} type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Registering…' : 'Register'}
      </button>
    </form>
  )
}
