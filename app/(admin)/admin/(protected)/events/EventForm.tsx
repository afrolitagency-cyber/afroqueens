'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEvent, updateEvent } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

function toLocalInput(iso?: string | Date | null) {
  if (!iso) return ''
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Props {
  mode: 'create' | 'edit'
  event?: {
    id: string
    title: string
    slug: string
    description: string | null
    location: string | null
    startsAt: string
    endsAt: string | null
    published: boolean
    tagName: string | null
    confirmEmailSubject: string | null
    confirmEmailBody: string | null
  }
}

export default function EventForm({ mode, event }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(event?.title ?? '')
  const [slug, setSlug] = useState(event?.slug ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.startsAt))
  const [endsAt, setEndsAt] = useState(toLocalInput(event?.endsAt))
  const [published, setPublished] = useState(event?.published ?? true)
  const [tagName, setTagName] = useState(event?.tagName ?? '')
  const [confirmEmailSubject, setConfirmEmailSubject] = useState(event?.confirmEmailSubject ?? '')
  const [confirmEmailBody, setConfirmEmailBody] = useState(event?.confirmEmailBody ?? '')

  const save = () => {
    setError(null)
    startTransition(async () => {
      try {
        const payload = {
          title,
          slug: slug || undefined,
          description,
          location,
          startsAt,
          endsAt: endsAt || undefined,
          published,
          tagName: tagName || undefined,
          confirmEmailSubject,
          confirmEmailBody,
        }
        if (mode === 'create') {
          const created = await createEvent(payload)
          router.push(`/admin/events/${created.id}/edit`)
          router.refresh()
        } else if (event) {
          await updateEvent(event.id, payload)
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{mode === 'create' ? 'New event' : 'Edit event'}</div>
          <div className={styles.sub}>
            Creates a public page and a newsletter tag for registrants
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <Link href="/admin/events" className={styles.actionBtn}>
            ← Back
          </Link>
          <button type="button" className={styles.addBtn} onClick={save} disabled={isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', color: '#C8102E', padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 8, padding: '1.25rem', maxWidth: 640, display: 'grid', gap: '.85rem' }}>
        <div>
          <label className={styles.label}>Title *</label>
          <input className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={styles.label}>Slug (URL)</label>
          <input
            className={styles.input}
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="auto from title"
          />
          <div style={{ fontSize: '.75rem', color: '#888', marginTop: '.35rem' }}>
            Public URL: /events/{slug || 'your-slug'}
          </div>
        </div>
        <div>
          <label className={styles.label}>Description</label>
          <textarea
            className={styles.input}
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div>
          <label className={styles.label}>Location</label>
          <input className={styles.input} value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div>
          <label className={styles.label}>Starts *</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={startsAt}
            onChange={e => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Ends (optional)</label>
          <input
            type="datetime-local"
            className={styles.input}
            value={endsAt}
            onChange={e => setEndsAt(e.target.value)}
          />
        </div>
        <div>
          <label className={styles.label}>Newsletter tag</label>
          <input
            className={styles.input}
            value={tagName}
            onChange={e => setTagName(e.target.value)}
            placeholder="e.g. afroqueens-rap"
          />
          <div style={{ fontSize: '.75rem', color: '#888', marginTop: '.35rem' }}>
            Registrants are added to this tag so you can send reminders from Newsletter → Compose → Tag.
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', marginTop: '.25rem' }}>
          <div className={styles.label} style={{ marginBottom: '.65rem' }}>
            Registration confirmation email
          </div>
          <div style={{ fontSize: '.75rem', color: '#888', marginBottom: '.75rem' }}>
            Sent immediately when someone registers on the site. Leave blank to use the default.
          </div>
          <div style={{ display: 'grid', gap: '.85rem' }}>
            <div>
              <label className={styles.label}>Email subject (optional)</label>
              <input
                className={styles.input}
                value={confirmEmailSubject}
                onChange={e => setConfirmEmailSubject(e.target.value)}
                placeholder={`You're registered — ${title || 'Event name'}`}
              />
            </div>
            <div>
              <label className={styles.label}>Custom message (optional)</label>
              <textarea
                className={styles.input}
                rows={5}
                value={confirmEmailBody}
                onChange={e => setConfirmEmailBody(e.target.value)}
                placeholder={'e.g. Please arrive by 6:30pm. Bring a valid ID. Dress code: smart casual.\n\nDoors open at 7pm.'}
                style={{ resize: 'vertical' }}
              />
              <div style={{ fontSize: '.75rem', color: '#888', marginTop: '.35rem' }}>
                Shown in the confirmation email (what to bring, Zoom link, dress code, etc.). Date, time, and location are still included automatically.
              </div>
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.85rem' }}>
          <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} />
          Published (visible on /events)
        </label>
      </div>
    </div>
  )
}
