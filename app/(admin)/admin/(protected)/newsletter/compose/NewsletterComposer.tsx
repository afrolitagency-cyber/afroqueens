'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './newsletter-compose.module.css'

const DRAFT_KEY = 'afroqueens-newsletter-draft'
const SELECTED_KEY = 'afroqueens-newsletter-selected'

type Audience = 'all' | 'selected' | 'tag'

interface Tag {
  id: string
  name: string
}

interface Draft {
  subject: string
  previewText: string
  heroTitle: string
  heroSub: string
  intro: string
  body: string
  signOff: string
  ctaText: string
  senderName: string
  senderEmail: string
  replyTo: string
  template: string
}

const DEFAULT: Draft = {
  subject: 'The Frequency: Issue #12 — June 2026 Edition',
  previewText: 'This month: Adaeze\'s studio diary, Lagos Electronic recap, and 5 artists you need to know →',
  heroTitle: 'The Frequency\nJune 2026 Edition',
  heroSub: 'Your monthly deep dive into African music, culture, and the women shaping its future.',
  intro: 'Hi [First Name],\n\nJune has been extraordinary. From Adaeze\'s sold-out London residency to the electric atmosphere at Lagos Electronic 2026, this month reminded us exactly why we do what we do. Thank you for being part of this community.',
  body: '',
  signOff: 'As always, if there\'s an artist you think we should be covering, hit reply. We read every message.\n\nWith love and sound,\nThe Afroqueens FM Team',
  ctaText: 'Read This Month\'s Stories →',
  senderName: 'Afroqueens FM',
  senderEmail: 'hello@afroqueens.fm',
  replyTo: 'hello@afroqueens.fm',
  template: 'frequency',
}

const ARTICLE_BLOCKS = [
  {
    title: 'Cover Story: Adaeze\'s Studio Diary',
    body: 'We spent 48 hours inside Adaeze\'s London studio as she recorded what may be her most ambitious work yet. She told us everything — the silence, the pressure, and the moment it all clicked.',
  },
  {
    title: 'Festival Review: Lagos Electronic 2026',
    body: '40,000 people, five stages, two unforgettable headliners. Our correspondent filed this from the pit of the main stage as the sun set over Lagos Island.',
  },
  {
    title: '5 Artists You Need to Know Right Now',
    body: 'From Abuja to Amsterdam — emerging artists from across the continent who are quietly building something remarkable. Our list for June 2026.',
  },
]

export default function NewsletterComposer({
  eligibleCount,
  tags,
  initialAudience = 'all',
}: {
  eligibleCount: number
  tags: Tag[]
  initialAudience?: Audience
}) {
  const [draft, setDraft] = useState<Draft>(DEFAULT)
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [scheduledFor, setScheduledFor] = useState('')
  const [audience, setAudience] = useState<Audience>(initialAudience)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tagIds, setTagIds] = useState<string[]>([])
  const [recipientCount, setRecipientCount] = useState(eligibleCount)
  const [toast, setToast] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setDraft({ ...DEFAULT, ...JSON.parse(saved) })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY)
      if (raw) setSelectedIds(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadCount = async () => {
      const params = new URLSearchParams({ audience })
      if (audience === 'selected' && selectedIds.length) {
        params.set('ids', selectedIds.join(','))
      }
      if (audience === 'tag' && tagIds.length) {
        params.set('tagIds', tagIds.join(','))
      }
      try {
        const res = await fetch(`/api/newsletter/send?${params}`)
        const data = await res.json()
        if (!cancelled && typeof data.count === 'number') {
          setRecipientCount(data.count)
        }
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

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    showToast('Draft saved locally')
  }

  const payload = (extra: Record<string, unknown> = {}) => ({
    subject: draft.subject,
    previewText: draft.previewText,
    heroTitle: draft.heroTitle,
    heroSub: draft.heroSub,
    intro: draft.intro,
    articles: ARTICLE_BLOCKS,
    signOff: draft.signOff,
    ctaText: draft.ctaText,
    ctaUrl: '/',
    senderName: draft.senderName,
    senderEmail: draft.senderEmail,
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
    if (schedule === 'later' && !scheduledFor) {
      showToast('Choose a schedule date and time')
      return
    }

    const verb = schedule === 'later' ? 'Schedule' : 'Send'
    if (!confirm(`${verb} this newsletter to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}?`)) return

    setSending(true)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      showToast(data.message || (data.scheduled ? 'Campaign scheduled' : 'Newsletter sent'))
      if (data.sent || data.scheduled) localStorage.removeItem(DRAFT_KEY)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send newsletter')
    } finally {
      setSending(false)
    }
  }

  const handleTestSend = async () => {
    if (!testEmail.trim()) {
      showToast('Enter your email for a test send')
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

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
  }

  const heroLines = draft.heroTitle.split('\n')
  const sendLabel = schedule === 'later' ? (sending ? 'Scheduling…' : 'Schedule send') : (sending ? 'Sending…' : 'Send now')

  return (
    <div className={styles.composerPage}>
      <div className={styles.editorTopbar}>
        <div className={styles.editorTopLeft}>
          <Link href="/admin/newsletter" className={styles.backBtn}>← Back to Newsletter</Link>
          <span className={styles.editorPageTitle}>Create Newsletter</span>
        </div>
        <div className={styles.editorTopRight}>
          <button type="button" className={styles.draftBtn} onClick={saveDraft}>Save Draft</button>
          <button type="button" className={styles.previewBtn} onClick={() => setPreviewOpen(true)}>
            👁 Preview Email
          </button>
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || recipientCount === 0}
          >
            ✉ {sendLabel}
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
              <div className={styles.recipPill}>✉ {audienceLabel()}</div>
              <span className={styles.recipCount}>
                {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>Email Body</div>
            <div className={styles.bodyToolbar}>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('bold') }}><b>B</b></button>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('italic') }}><i>I</i></button>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('underline') }}><u>U</u></button>
              <span className={styles.tbSep}>|</span>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'h2') }}>H2</button>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'h3') }}>H3</button>
              <span className={styles.tbSep}>|</span>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList') }}>≡ List</button>
              <button type="button" className={styles.tb} onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'blockquote') }}>&quot; Quote</button>
              <span className={styles.tbSep}>|</span>
              <button type="button" className={styles.tb} onMouseDown={e => {
                e.preventDefault()
                const url = prompt('Link URL:')
                if (url) execCmd('createLink', url)
              }}>🔗 Link</button>
              <span className={styles.tbSep}>|</span>
              <button type="button" className={styles.tbAdd}>+ Article Block</button>
              <button type="button" className={styles.tbAdd}>+ CTA Button</button>
              <button type="button" className={styles.tbAdd}>+ Divider</button>
            </div>

            <div className={styles.emailFrame}>
              <div className={styles.emailHeaderBar}>
                <div className={styles.emailLogo}>AFRO<span>Q</span>UEENS</div>
                <div className={styles.emailLogoDate}>The Frequency · Issue #12 · June 2026</div>
              </div>

              <div className={styles.emailHero}>
                <div className={styles.emailHeroLabel}>Monthly Newsletter</div>
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
                <div
                  className={styles.emailHeroSub}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => update('heroSub', e.currentTarget.innerText)}
                >
                  {draft.heroSub}
                </div>
              </div>

              <div className={styles.emailBody}>
                <p
                  className={styles.emailP}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => update('intro', e.currentTarget.innerText)}
                >
                  {draft.intro.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <><br /><br /></>}</span>
                  ))}
                </p>

                <div className={styles.emailDivider} />
                <div className={styles.emailSectionTitle}>This Month&apos;s Highlights</div>

                {ARTICLE_BLOCKS.map(block => (
                  <div key={block.title} className={styles.emailBlock}>
                    <div className={styles.emailBlockTitle} contentEditable suppressContentEditableWarning>
                      {block.title}
                    </div>
                    <div className={styles.emailBlockBody} contentEditable suppressContentEditableWarning>
                      {block.body}
                    </div>
                  </div>
                ))}

                <div className={styles.emailDivider} />

                <p
                  className={styles.emailP}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={e => update('signOff', e.currentTarget.innerText)}
                >
                  {draft.signOff.split('\n').map((line, i, arr) => (
                    <span key={i}>
                      {line.includes('The Afroqueens FM Team') ? (
                        <><br /><strong>The Afroqueens FM Team</strong></>
                      ) : (
                        line
                      )}
                      {i < arr.length - 1 && line !== 'With love and sound,' && <><br /><br /></>}
                      {line === 'With love and sound,' && <><br /></>}
                    </span>
                  ))}
                </p>

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
              </div>

              <div className={styles.emailFooterBar}>
                <div className={styles.emailFooterText}>
                  You&apos;re receiving this because you subscribed at afroqueens.fm<br />
                  <a href="/api/newsletter/unsubscribe">Unsubscribe</a>
                  {' · '}
                  <a href="#">View in browser</a>
                  {' · '}
                  <a href="/about">Privacy Policy</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.composerSidebar}>
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
                {!tags.length && (
                  <div className={styles.scheduleNote}>Create tags on the subscriber page first.</div>
                )}
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
            <div className={styles.audienceNote}>
              Only <strong>active + confirmed</strong> subscribers receive mail.{' '}
              <Link href="/admin/newsletter/campaigns">Campaign history →</Link>
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
            <div className={styles.scheduleNote}>
              {schedule === 'now' ? (
                <>Email sends immediately (large lists continue in the background via cron).</>
              ) : (
                <>Pick a date/time below. Vercel Hobby runs the send cron once daily — use an external cron every 5 min for tighter schedules.</>
              )}
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
            <div className={styles.scheduleNote} style={{ marginTop: '0.7rem' }}>
              Sends only to this address. Use this before blasting the full list.
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>From</div>
            <div className={styles.audienceNote} style={{ marginBottom: '0.85rem' }}>
              Delivery uses <code>EMAIL_FROM</code> from env (must be a verified Resend domain).
              Reply-To can be set below.
            </div>
            <div className={styles.sideField}>
              <div className={styles.sideLabel}>Sender Name (display)</div>
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

          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Template</div>
            <div className={styles.sideField}>
              <select
                className={styles.sideSelect}
                value={draft.template}
                onChange={e => update('template', e.target.value)}
              >
                <option value="frequency">The Frequency (Monthly)</option>
                <option value="episode">New Episode Alert</option>
                <option value="artist">Artist Spotlight</option>
                <option value="event">Event Announcement</option>
                <option value="plain">Plain Text</option>
              </select>
            </div>
          </div>

          <div className={styles.sendConfirm}>
            Ready to {schedule === 'later' ? 'schedule' : 'send'}? This email will go to{' '}
            <strong>{recipientCount} recipient{recipientCount === 1 ? '' : 's'}</strong>.
            {schedule === 'now' && ' Large blasts may take a few minutes to finish.'}
            <button
              type="button"
              className={styles.sendConfirmBtn}
              onClick={handleSend}
              disabled={sending || recipientCount === 0}
            >
              ✉ {sendLabel}
            </button>
          </div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {previewOpen && (
        <div className={styles.previewOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>Email Preview — {draft.subject}</span>
              <button type="button" className={styles.previewClose} onClick={() => setPreviewOpen(false)}>×</button>
            </div>
            <div className={styles.emailFrame} style={{ border: 'none', borderRadius: 0 }}>
              <div className={styles.emailHeaderBar}>
                <div className={styles.emailLogo}>AFRO<span>Q</span>UEENS</div>
                <div className={styles.emailLogoDate}>The Frequency · Issue #12 · June 2026</div>
              </div>
              <div className={styles.emailHero}>
                <div className={styles.emailHeroLabel}>Monthly Newsletter</div>
                <div className={styles.emailHeroTitle}>
                  {heroLines.map((line, i) => (
                    <span key={i}>{line}{i < heroLines.length - 1 && <br />}</span>
                  ))}
                </div>
                <div className={styles.emailHeroSub}>{draft.heroSub}</div>
              </div>
              <div className={styles.emailBody}>
                <p className={styles.emailP} style={{ whiteSpace: 'pre-wrap' }}>{draft.intro}</p>
                <div className={styles.emailDivider} />
                <div className={styles.emailSectionTitle}>This Month&apos;s Highlights</div>
                {ARTICLE_BLOCKS.map(block => (
                  <div key={block.title} className={styles.emailBlock}>
                    <div className={styles.emailBlockTitle}>{block.title}</div>
                    <div className={styles.emailBlockBody}>{block.body}</div>
                  </div>
                ))}
                <div className={styles.emailDivider} />
                <p className={styles.emailP} style={{ whiteSpace: 'pre-wrap' }}>{draft.signOff}</p>
                <div className={styles.emailCtaWrap}>
                  <span className={styles.emailCta}>{draft.ctaText}</span>
                </div>
              </div>
              <div className={styles.emailFooterBar}>
                <div className={styles.emailFooterText}>
                  You&apos;re receiving this because you subscribed at afroqueens.fm
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
