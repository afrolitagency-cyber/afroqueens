'use client'
// components/public/newsletter/NewsletterSignup.tsx
import { useState, useTransition } from 'react'
import styles from './newsletter.module.css'

interface Props {
  variant?: 'inline' | 'banner'
}

export default function NewsletterSignup({ variant = 'banner' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [name,  setName]  = useState('')
  const [done,  setDone]  = useState(false)
  const [error, setError] = useState('')

  const submit = () => {
    if (!email) { setError('Please enter your email.'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong.')
      }
    })
  }

  if (done) {
    return (
      <div className={`${styles.wrap} ${styles[variant]} ${styles.done}`}>
        <span className={styles.doneIcon}>✓</span>
        <span className={styles.doneText}>You're in! Welcome to the Afroqueens FM community.</span>
      </div>
    )
  }

  return (
    <div className={`${styles.wrap} ${styles[variant]}`}>
      <div className={styles.copy}>
        <div className="sl">Newsletter</div>
        <h2 className={styles.heading}>Stay in the <em>Loop</em></h2>
        <p className={styles.desc}>
          New artists, episode drops, culture coverage — straight to your inbox. No spam, ever.
        </p>
      </div>

      <div className={styles.fields}>
        <input
          className={styles.input}
          placeholder="Your name (optional)"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          className={styles.input}
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        {error && <p className={styles.error}>{error}</p>}
        <button
          onClick={submit}
          disabled={isPending}
          className={styles.btn}
        >
          {isPending ? 'Subscribing…' : 'Subscribe'}
        </button>
        <p className={styles.fine}>No spam. Unsubscribe anytime.</p>
      </div>
    </div>
  )
}
