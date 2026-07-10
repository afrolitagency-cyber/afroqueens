'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './newsletter-compose.module.css'

const DRAFT_KEY = 'afroqueens-newsletter-draft'
const SELECTED_KEY = 'afroqueens-newsletter-selected'

type Audience = 'all' | 'selected' | 'tag'
type Template = 'frequency' | 'event' | 'plain'
type DigestPeriod = 14 | 30

interface Tag {
  id: string
  name: string
}

export interface DigestPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  publishedAt: string
  url: string
}

interface Draft {
  subject: string
  previewText: string
  heroTitle: string
  heroSub: string
  intro: string
  signOff: string
  ctaText: string
  ctaUrl: string
  senderName: string
  replyTo: string
  template: Template
  includeHighlights: boolean
  digestPeriod: DigestPeriod
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventNotes: string
}

const FREQUENCY_DEFAULT: Draft = {
  subject: 'The Frequency — what’s new at Afroqueens',
  previewText: 'Stories, culture, and updates from the last few weeks →',
  heroTitle: 'The Frequency',
  heroSub: 'Your roundup of Afroqueens stories, culture, and the women shaping African music.',
  intro: "Hi [First Name],\n\nHere’s what’s been happening on Afroqueens. Catch up on the latest stories below.",
  signOff: "As always, if there's an artist you think we should be covering, hit reply. We read every message.\n\nWith love and sound,\nThe Afroqueens FM Team",
  ctaText: 'Read more on the site →',
  ctaUrl: '/blog',
  senderName: 'Afroqueens FM',
  replyTo: 'hello@afroqueens.fm',
  template: 'frequency',
  includeHighlights: true,
  digestPeriod: 30,
  eventName: '',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  eventNotes: '',
}

const EVENT_DEFAULT: Partial<Draft> = {
  subject: "You're registered — Afroqueens Rap",
  previewText: 'Your registration is confirmed. Here are the event details.',
  heroTitle: "You're in — registration confirmed",
  heroSub: '',
  intro: "Hi [First Name],\n\nThanks for registering. We're excited to have you with us. Save the details below so you don't miss the event.",
  signOff: "See you there,\nThe Afroqueens FM Team",
  ctaText: 'Add to calendar / more info →',
  ctaUrl: '/',
  includeHighlights: false,
  eventName: 'Afroqueens Rap',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  eventNotes: 'Please arrive 30 minutes early. Bring a valid ID if required at the door.',
}

const PLAIN_DEFAULT: Partial<Draft> = {
  subject: 'A note from Afroqueens FM',
  previewText: 'A short update from the team.',
  heroTitle: 'A quick note',
  heroSub: '',
  intro: 'Hi [First Name],\n\n',
  signOff: 'With love and sound,\nThe Afroqueens FM Team',
  ctaText: '',
  ctaUrl: '/',
  includeHighlights: false,
}

export default function NewsletterComposer({
  eligibleCount,
  tags,
  initialAudience = 'all',
  initialTagIds = [],
  digestPosts = [],
  siteUrl = '',
}: {
  eligibleCount: number
  tags: Tag[]
  initialAudience?: Audience
  initialTagIds?: string[]
  digestPosts?: DigestPost[]
  siteUrl?: string
}) {
  const [draft, setDraft] = useState<Draft>(FREQUENCY_DEFAULT)
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [scheduledFor, setScheduledFor] = useState('')
  const [audience, setAudience] = useState<Audience>(initialAudience)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds)
  const [recipientCount, setRecipientCount] = useState(eligibleCount)
  const [toast, setToast] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([])

  const periodPosts = digestPosts.filter(p => {
    const ageMs = Date.now() - new Date(p.publishedAt).getTime()
    return ageMs <= draft.digestPeriod * 24 * 60 * 60 * 1000
  })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        const template: Template =
          parsed.template === 'event' || parsed.template === 'plain' ? parsed.template : 'frequency'
        const digestPeriod: DigestPeriod = parsed.digestPeriod === 14 ? 14 : 30
        setDraft({ ...FREQUENCY_DEFAULT, ...parsed, template, digestPeriod })
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY)
      if (raw) setSelectedIds(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  // Select all posts in the current period when period or post list changes
  useEffect(() => {
    setSelectedPostIds(periodPosts.map(p => p.id))
  }, [draft.digestPeriod, digestPosts.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    const loadCount = async () => {
      const params = new URLSearchParams({ audience })
      if (audience === 'selected' && selectedIds.length) params.set('ids', selectedIds.join(','))
      if (audience === 'tag' && tagIds.length) params.set('tagIds', tagIds.join(','))
      try {
        const res = await fetch(`/api/newsletter/send?${params}`)
        const data = await res.json()
        if (!cancelled && typeof data.count === 'number') setRecipientCount(data.count)
      } catch {
        if (!cancelled) setRecipientCount(0)
      }
    }
    loadCount()
    return () => { cancelled = true }
  }, [audience, selectedIds, tagIds])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 4500)
  }

  const update = <K extends keyof Draft>(key: K, val: Draft[K]) => {
    setDraft(prev => ({ ...prev, [key]: val }))
  }

  const switchTemplate = (next: Template) => {
    if (next === draft.template) return
    const defaults =
      next === 'event' ? EVENT_DEFAULT : next === 'plain' ? PLAIN_DEFAULT : FREQUENCY_DEFAULT
    setDraft(prev => ({
      ...prev,
      ...defaults,
      template: next,
      senderName: prev.senderName,
      replyTo: prev.replyTo,
      digestPeriod: prev.digestPeriod,
    }))
  }

  const setDigestPeriod = (days: DigestPeriod) => {
    update('digestPeriod', days)
    const label = days === 14 ? 'fortnight' : 'month'
    setDraft(prev => ({
      ...prev,
      digestPeriod: days,
      subject: days === 14
        ? 'The Frequency — fortnightly roundup'
        : 'The Frequency — monthly roundup',
      previewText: `Catch up on Afroqueens stories from the last ${label} →`,
      heroTitle: days === 14 ? 'The Frequency\nFortnightly Roundup' : 'The Frequency\nMonthly Roundup',
      intro: `Hi [First Name],\n\nHere’s what’s been published on Afroqueens over the last ${days} days. Dive in below.`,
      ctaText: days === 14 ? 'Read the latest →' : "Read this month's stories →",
    }))
  }

  const togglePost = (id: string) => {
    setSelectedPostIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const selectedArticles = periodPosts
    .filter(p => selectedPostIds.includes(p.id))
    .map(p => ({
      title: p.title,
      body: p.excerpt,
      url: p.url,
    }))

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, selectedPostIds }))
    showToast('Draft saved locally')
  }

  const payload = (extra: Record<string, unknown> = {}) => ({
    subject: draft.subject,
    previewText: draft.previewText,
    template: draft.template,
    heroTitle: draft.heroTitle,
    heroSub: draft.template === 'frequency' ? draft.heroSub : undefined,
    intro: draft.intro,
    articles: draft.template === 'frequency' && draft.includeHighlights ? selectedArticles : [],
    includeHighlights: draft.template === 'frequency' ? draft.includeHighlights : false,
    event:
      draft.template === 'event'
        ? {
            eventName: draft.eventName,
            eventDate: draft.eventDate,
            eventTime: draft.eventTime,
            eventLocation: draft.eventLocation,
            eventNotes: draft.eventNotes,
          }
        : undefined,
    signOff: draft.signOff,
    ctaText: draft.ctaText,
    ctaUrl: draft.ctaUrl?.startsWith('http')
      ? draft.ctaUrl
      : `${siteUrl}${draft.ctaUrl?.startsWith('/') ? '' : '/'}${draft.ctaUrl || '/blog'}`,
    senderName: draft.senderName,
    replyTo: draft.replyTo,
    schedule,
    scheduledFor: schedule === 'later' && scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
    audience,
    recipientIds: audience === 'selected' ? selectedIds : undefined,
    tagIds: audience === 'tag' ? tagIds : undefined,
    ...extra,
  })

  const audienceLabel = () => {
    if (audience === 'selected') return `Selected (${selectedIds.length} picked)`
    if (audience === 'tag') return 'By tag'
    return 'All confirmed subscribers'
  }

  const handleSend = async () => {
    if (recipientCount === 0) {
      showToast('No eligible recipients for this audience')
      return
    }
    if (audience === 'selected' && !selectedIds.length) {
      showToast('No subscribers selected — pick some on the subscriber list first')
      return
    }
    if (audience === 'tag' && !tagIds.length) {
      showToast('Select at least one tag')
      return
    }
    if (draft.template === 'event' && (!draft.eventName.trim() || !draft.eventDate.trim())) {
      showToast('Event name and date are required')
      return
    }
    if (schedule === 'later' && !scheduledFor) {
      showToast('Choose a schedule date and time')
      return
    }
    if (
      draft.template === 'frequency' &&
      draft.includeHighlights &&
      selectedArticles.length === 0
    ) {
      if (!confirm('No posts selected for highlights. Send without story blocks?')) return
    }

    const verb = schedule === 'later' ? 'Schedule' : 'Send'
    if (!confirm(`${verb} this email to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}?`)) return

    setSending(true)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      showToast(data.message || (data.scheduled ? 'Campaign scheduled' : 'Email sent'))
      if (data.sent || data.scheduled) localStorage.removeItem(DRAFT_KEY)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send email')
    } finally {
      setSending(false)
    }
  }

  const handleTestSend = async () => {
    if (!testEmail.trim()) {
      showToast('Enter your email for a test send')
      return
    }
    if (draft.template === 'event' && (!draft.eventName.trim() || !draft.eventDate.trim())) {
      showToast('Event name and date are required')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload({ testEmail: testEmail.trim(), schedule: 'now' })),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Test send failed')
      showToast(data.message || 'Test email sent')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send test email')
    } finally {
      setSending(false)
    }
  }

  const heroLines = draft.heroTitle.split('\n')
  const sendLabel = schedule === 'later' ? (sending ? 'Scheduling…' : 'Schedule send') : (sending ? 'Sending…' : 'Send now')
  const isFrequency = draft.template === 'frequency'
  const isEvent = draft.template === 'event'
  const isPlain = draft.template === 'plain'

  const renderBodyPreview = () => (
    <div className={styles.emailFrame}>
      <div className={styles.emailHeaderBar}>
        <div className={styles.emailLogo}>AFRO<span>Q</span>UEENS</div>
        <div className={styles.emailLogoDate}>
          {isEvent ? 'Event confirmation' : isPlain ? 'Message' : 'The Frequency'}
        </div>
      </div>

      {isPlain ? (
        <div className={styles.emailBody} style={{ paddingTop: '1.5rem' }}>
          <div
            className={styles.emailHeroTitle}
            style={{ color: '#0a0a0a', fontSize: '1.5rem', marginBottom: '1rem' }}
            contentEditable
            suppressContentEditableWarning
            onBlur={e => update('heroTitle', e.currentTarget.innerText)}
          >
            {draft.heroTitle}
          </div>
        </div>
      ) : (
        <div className={styles.emailHero} style={isEvent ? { background: '#0a0a0a' } : undefined}>
          <div className={styles.emailHeroLabel} style={isEvent ? { color: '#C8102E' } : undefined}>
            {isEvent ? 'Registration confirmed' : 'Monthly Newsletter'}
          </div>
          <div
            className={styles.emailHeroTitle}
            contentEditable
            suppressContentEditableWarning
            onBlur={e => update('heroTitle', e.currentTarget.innerText)}
          >
            {heroLines.map((line, i) => (
              <span key={i}>{line}{i < heroLines.length - 1 && <br />}</span>
            ))}
          </div>
          {isFrequency && (
            <div
              className={styles.emailHeroSub}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => update('heroSub', e.currentTarget.innerText)}
            >
              {draft.heroSub}
            </div>
          )}
        </div>
      )}

      <div className={styles.emailBody}>
        <p
          className={styles.emailP}
          contentEditable
          suppressContentEditableWarning
          onBlur={e => update('intro', e.currentTarget.innerText)}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {draft.intro}
        </p>

        {isEvent && (
          <>
            <div className={styles.emailDivider} />
            <div className={styles.emailSectionTitle}>Event details</div>
            <div className={styles.emailBlock}>
              <div className={styles.emailBlockBody} style={{ lineHeight: 1.9 }}>
                <div><strong>Event:</strong> {draft.eventName || '—'}</div>
                <div><strong>Date:</strong> {draft.eventDate || '—'}</div>
                {draft.eventTime && <div><strong>Time:</strong> {draft.eventTime}</div>}
                {draft.eventLocation && <div><strong>Location:</strong> {draft.eventLocation}</div>}
                {draft.eventNotes && (
                  <div style={{ marginTop: '.6rem', color: '#555' }}>{draft.eventNotes}</div>
                )}
              </div>
            </div>
          </>
        )}

        {isFrequency && draft.includeHighlights && (
          <>
            <div className={styles.emailDivider} />
            <div className={styles.emailSectionTitle}>
              {draft.digestPeriod === 14 ? 'Fortnightly highlights' : "This month's highlights"}
            </div>
            {selectedArticles.length === 0 ? (
              <div className={styles.emailBlock}>
                <div className={styles.emailBlockBody} style={{ color: '#888' }}>
                  No published posts in the last {draft.digestPeriod} days. Publish blog posts or widen the period.
                </div>
              </div>
            ) : (
              selectedArticles.map(block => (
                <div key={block.title} className={styles.emailBlock}>
                  <div className={styles.emailBlockTitle}>{block.title}</div>
                  <div className={styles.emailBlockBody}>{block.body}</div>
                  {block.url && (
                    <div style={{ marginTop: '.4rem', fontSize: '.78rem', color: '#C8102E' }}>Read more →</div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        <div className={styles.emailDivider} />
        <p
          className={styles.emailP}
          contentEditable
          suppressContentEditableWarning
          onBlur={e => update('signOff', e.currentTarget.innerText)}
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {draft.signOff}
        </p>

        {draft.ctaText && (
          <div className={styles.emailCtaWrap}>
            <span
              className={styles.emailCta}
              contentEditable
              suppressContentEditableWarning
              onBlur={e => update('ctaText', e.currentTarget.innerText)}
            >
              {draft.ctaText}
            </span>
          </div>
        )}
      </div>

      <div className={styles.emailFooterBar}>
        <div className={styles.emailFooterText}>
          {isEvent
            ? "You're receiving this because you registered for an Afroqueens event."
            : "You're receiving this because you subscribed at afroqueens.fm"}
          <br />
          <a href="/api/newsletter/unsubscribe">Unsubscribe</a>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.composerPage}>
      <div className={styles.editorTopbar}>
        <div className={styles.editorTopLeft}>
          <Link href="/admin/newsletter" className={styles.backBtn}>← Back to Newsletter</Link>
          <span className={styles.editorPageTitle}>Create email</span>
        </div>
        <div className={styles.editorTopRight}>
          <button type="button" className={styles.draftBtn} onClick={saveDraft}>Save Draft</button>
          <button type="button" className={styles.previewBtn} onClick={() => setPreviewOpen(true)}>
            Preview Email
          </button>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
          >
            {sendLabel}
          </button>
        </div>
      </div>

      <div className={styles.composerLayout}>
        <div className={styles.composerMain}>
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>Subject Line</div>
            <input
              className={styles.subjectInput}
              value={draft.subject}
              onChange={e => update('subject', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>
              Preview Text{' '}
              <span className={styles.fieldHint}>(shown in inbox before opening)</span>
            </div>
            <input
              className={styles.fieldInput}
              value={draft.previewText}
              onChange={e => update('previewText', e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>To</div>
            <div className={styles.recipientRow}>
              <div className={styles.recipPill}>{audienceLabel()}</div>
              <span className={styles.recipCount}>
                {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {isEvent && (
            <>
              <div className={styles.divider} />
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>Event details</div>
                <div style={{ display: 'grid', gap: '.65rem' }}>
                  <input
                    className={styles.fieldInput}
                    placeholder="Event name *"
                    value={draft.eventName}
                    onChange={e => update('eventName', e.target.value)}
                  />
                  <input
                    className={styles.fieldInput}
                    placeholder="Date * (e.g. Saturday 18 July 2026)"
                    value={draft.eventDate}
                    onChange={e => update('eventDate', e.target.value)}
                  />
                  <input
                    className={styles.fieldInput}
                    placeholder="Time (optional)"
                    value={draft.eventTime}
                    onChange={e => update('eventTime', e.target.value)}
                  />
                  <input
                    className={styles.fieldInput}
                    placeholder="Location (optional)"
                    value={draft.eventLocation}
                    onChange={e => update('eventLocation', e.target.value)}
                  />
                  <textarea
                    className={styles.fieldInput}
                    rows={3}
                    placeholder="Extra notes (optional) — arrival time, what to bring…"
                    value={draft.eventNotes}
                    onChange={e => update('eventNotes', e.target.value)}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <input
                    className={styles.fieldInput}
                    placeholder="CTA link URL (optional)"
                    value={draft.ctaUrl}
                    onChange={e => update('ctaUrl', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.divider} />

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>Email body</div>
            {renderBodyPreview()}
          </div>
        </div>

        <div className={styles.composerSidebar}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Template</div>
            <div className={styles.sideField}>
              <select
                className={styles.sideSelect}
                value={draft.template}
                onChange={e => switchTemplate(e.target.value as Template)}
              >
                <option value="frequency">The Frequency (Monthly)</option>
                <option value="event">Event registration</option>
                <option value="plain">Plain message</option>
              </select>
            </div>
            <div className={styles.scheduleNote} style={{ marginTop: '.55rem' }}>
              {isFrequency && 'Pulls published blog posts from the period you choose.'}
              {isEvent && 'Confirmation email with event name, date, and details — no monthly highlights.'}
              {isPlain && 'Simple message only — title, body, sign-off.'}
            </div>
            {isFrequency && (
              <>
                <div className={styles.sideLabel} style={{ marginTop: '.85rem' }}>Digest period</div>
                <div className={styles.scheduleToggle} style={{ marginTop: '.4rem' }}>
                  <button
                    type="button"
                    className={`${styles.schedBtn} ${draft.digestPeriod === 14 ? styles.schedActive : ''}`}
                    onClick={() => setDigestPeriod(14)}
                  >
                    Fortnight (14d)
                  </button>
                  <button
                    type="button"
                    className={`${styles.schedBtn} ${draft.digestPeriod === 30 ? styles.schedActive : ''}`}
                    onClick={() => setDigestPeriod(30)}
                  >
                    Month (30d)
                  </button>
                </div>
                <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.75rem', fontSize: '.8rem', color: '#444', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.includeHighlights}
                    onChange={e => update('includeHighlights', e.target.checked)}
                  />
                  Include story highlights
                </label>
                {draft.includeHighlights && (
                  <div style={{ marginTop: '.75rem' }}>
                    <div className={styles.sideLabel}>
                      Posts ({selectedPostIds.length}/{periodPosts.length})
                    </div>
                    {periodPosts.length === 0 ? (
                      <div className={styles.scheduleNote} style={{ marginTop: '.4rem' }}>
                        No published posts in the last {draft.digestPeriod} days.
                      </div>
                    ) : (
                      <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: '.4rem', display: 'grid', gap: '.35rem' }}>
                        {periodPosts.map(p => (
                          <label
                            key={p.id}
                            style={{ display: 'flex', gap: '.45rem', alignItems: 'flex-start', fontSize: '.75rem', color: '#444', cursor: 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPostIds.includes(p.id)}
                              onChange={() => togglePost(p.id)}
                              style={{ marginTop: 2 }}
                            />
                            <span>
                              <strong style={{ color: '#0a0a0a' }}>{p.title}</strong>
                              <br />
                              <span style={{ color: '#999' }}>
                                {new Date(p.publishedAt).toLocaleDateString('en-GB')} · {p.category}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Audience</div>
            <div className={styles.scheduleToggle} style={{ marginBottom: '.75rem' }}>
              {(['all', 'selected', 'tag'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.schedBtn} ${audience === mode ? styles.schedActive : ''}`}
                  onClick={() => setAudience(mode)}
                >
                  {mode === 'all' ? 'All' : mode === 'selected' ? 'Selected' : 'Tag'}
                </button>
              ))}
            </div>
            {audience === 'selected' && (
              <div className={styles.audienceNote} style={{ marginBottom: '.6rem' }}>
                {selectedIds.length
                  ? `${selectedIds.length} subscriber(s) from your last selection.`
                  : 'No selection saved — use checkboxes on the subscriber list.'}{' '}
                <Link href="/admin/newsletter">Manage list →</Link>
              </div>
            )}
            {audience === 'tag' && (
              <div className={styles.sideField}>
                <div className={styles.sideLabel}>Tags (any match)</div>
                <select
                  multiple
                  className={styles.sideSelect}
                  style={{ minHeight: 88 }}
                  value={tagIds}
                  onChange={e => setTagIds(Array.from(e.target.selectedOptions, o => o.value))}
                >
                  {tags.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.statRow}>
              <div className={styles.miniStat}>
                <div className={styles.miniStatVal}>{recipientCount}</div>
                <div className={styles.miniStatLabel}>Recipients</div>
              </div>
              <div className={styles.miniStat}>
                <div className={styles.miniStatVal}>{eligibleCount}</div>
                <div className={styles.miniStatLabel}>List total</div>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Send Schedule</div>
            <div className={styles.scheduleToggle}>
              <button
                type="button"
                className={`${styles.schedBtn} ${schedule === 'now' ? styles.schedActive : ''}`}
                onClick={() => setSchedule('now')}
              >
                Send Now
              </button>
              <button
                type="button"
                className={`${styles.schedBtn} ${schedule === 'later' ? styles.schedActive : ''}`}
                onClick={() => setSchedule('later')}
              >
                Schedule
              </button>
            </div>
            {schedule === 'later' && (
              <div className={styles.sideField} style={{ marginTop: '.75rem' }}>
                <div className={styles.sideLabel}>Send at</div>
                <input
                  type="datetime-local"
                  className={styles.sideInput}
                  value={scheduledFor}
                  onChange={e => setScheduledFor(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Test Send</div>
            <div className={styles.sideField}>
              <div className={styles.sideLabel}>Your email</div>
              <input
                className={styles.sideInput}
                type="email"
                placeholder="you@domain.com"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.draftBtn}
              style={{ width: '100%', marginTop: '0.4rem' }}
              onClick={handleTestSend}
              disabled={sending}
            >
              {sending ? 'Sending…' : 'Send test to me'}
            </button>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>From</div>
            <div className={styles.sideField}>
              <div className={styles.sideLabel}>Sender Name</div>
              <input
                className={styles.sideInput}
                value={draft.senderName}
                onChange={e => update('senderName', e.target.value)}
              />
            </div>
            <div className={styles.sideField}>
              <div className={styles.sideLabel}>Reply-To</div>
              <input
                className={styles.sideInput}
                type="email"
                value={draft.replyTo}
                onChange={e => update('replyTo', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.sendConfirm}>
            Ready to {schedule === 'later' ? 'schedule' : 'send'}? This goes to{' '}
            <strong>{recipientCount} recipient{recipientCount === 1 ? '' : 's'}</strong>.
            <button
              type="button"
              className={styles.sendConfirmBtn}
              onClick={handleSend}
              disabled={sending || recipientCount === 0}
            >
              {sendLabel}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {previewOpen && (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Preview — {draft.subject}</span>
              <button type="button" className={styles.previewClose} onClick={() => setPreviewOpen(false)}>×</button>
            </div>
            <div style={{ border: 'none', borderRadius: 0 }}>{renderBodyPreview()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
