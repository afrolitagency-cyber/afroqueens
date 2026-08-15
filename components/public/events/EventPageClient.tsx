'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from '@/app/(public)/events/events.module.css'

interface EventActionProps {
  title: string
  startsAt: string
  endsAt: string | null
  location: string | null
  compact?: boolean
  showRegister?: boolean
}

function calendarStamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export function EventActions({
  title,
  startsAt,
  endsAt,
  location,
  compact = false,
  showRegister = true,
}: EventActionProps) {
  const addToCalendar = () => {
    const start = calendarStamp(startsAt)
    const end = calendarStamp(endsAt ?? new Date(new Date(startsAt).getTime() + 2 * 60 * 60 * 1000).toISOString())
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${start}/${end}`,
      location: location ?? '',
    })
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener,noreferrer')
  }

  const scrollToRegister = () => {
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={compact ? styles.cardActions : styles.heroActions}>
      <button
        type="button"
        className={`${styles.primaryButton} ${showRegister ? '' : styles.hiddenAction}`.trim()}
        onClick={showRegister ? scrollToRegister : undefined}
        disabled={!showRegister}
        tabIndex={showRegister ? 0 : -1}
        aria-hidden={!showRegister}
      >
        Register now
      </button>
      <button type="button" className={styles.secondaryButton} onClick={addToCalendar}>
        Add to calendar
      </button>
    </div>
  )
}

export function EventCountdown({ startsAt }: { startsAt: string }) {
  const target = useMemo(() => new Date(startsAt).getTime(), [startsAt])
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setRemaining(Math.max(0, target - Date.now()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [target])

  if (remaining !== null && remaining <= 0) return null

  const days = remaining === null ? null : Math.floor(remaining / 86_400_000)
  const hours = remaining === null ? null : Math.floor((remaining % 86_400_000) / 3_600_000)
  const minutes = remaining === null ? null : Math.floor((remaining % 3_600_000) / 60_000)
  const seconds = remaining === null ? null : Math.floor((remaining % 60_000) / 1000)

  return (
    <div className={styles.countdownStrip}>
      <span className={styles.countdownLabel}>Event starts in</span>
      {[
        ['Days', days],
        ['Hours', hours],
        ['Minutes', minutes],
        ['Seconds', seconds],
      ].map(([label, value]) => (
        <div key={label} className={styles.countdownUnit}>
          <strong>{value === null ? '--' : String(value).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function EventShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Join me at ${title}: ${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.shareCard}>
      <span>Share this event</span>
      <div>
        <button type="button" onClick={shareWhatsApp}>WhatsApp</button>
        <button type="button" onClick={copyLink}>{copied ? 'Copied!' : 'Copy link'}</button>
      </div>
    </div>
  )
}
