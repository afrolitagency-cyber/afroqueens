'use client'
// app/(public)/contact/ContactForm.tsx
import { useState, useTransition } from 'react'
import styles from './contact.module.css'

const SUBJECTS = [
  'General Enquiry',
  'Press & Media',
  'Artist Submission',
  'Collaboration',
  'Advertising',
  'Other',
]

export default function ContactForm() {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState('')

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const submit = () => {
    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields.')
      return
    }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        setError('Something went wrong. Please try again.')
      }
    })
  }

  if (sent) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h3 className={styles.successTitle}>Message Received</h3>
        <p className={styles.successText}>
          Thanks for reaching out. We'll get back to you within 3–5 business days.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Your Name</label>
          <input
            className={styles.input}
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email Address</label>
          <input
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Subject</label>
        <select
          className={styles.select}
          value={subject}
          onChange={e => setSubject(e.target.value)}
        >
          <option value="">Select a subject…</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Message</label>
        <textarea
          className={styles.textarea}
          rows={7}
          placeholder="Tell us what's on your mind…"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        onClick={submit}
        disabled={isPending}
        className={styles.submitBtn}
      >
        {isPending ? 'Sending…' : 'Send Message'}
      </button>
    </div>
  )
}
