'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './newsletter-compose.module.css'

const DRAFT_KEY = 'afroqueens-newsletter-draft'

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

export default function NewsletterComposer({ activeCount }: { activeCount: number }) {
  const [draft, setDraft] = useState<Draft>(DEFAULT)
  const [schedule, setSchedule] = useState<'now' | 'later'>('now')
  const [toast, setToast] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setDraft({ ...DEFAULT, ...JSON.parse(saved) })
    } catch { /* ignore */ }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const update = <K extends keyof Draft>(key: K, val: Draft[K]) => {
    setDraft(prev => ({ ...prev, [key]: val }))
  }

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    showToast('Draft saved locally')
  }

  const handleSend = async () => {
    if (activeCount === 0) {
      showToast('No active subscribers to send to')
      return
    }
    if (!confirm(`Send this newsletter to ${activeCount} active subscriber${activeCount === 1 ? '' : 's'}?`)) return

    setSending(true)
    try {
      const res = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: draft.subject,
          previewText: draft.previewText,
          senderName: draft.senderName,
          senderEmail: draft.senderEmail,
          replyTo: draft.replyTo,
          schedule,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      showToast(data.message || 'Newsletter queued')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not send newsletter')
    } finally {
      setSending(false)
    }
  }

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
  }

  const heroLines = draft.heroTitle.split('\n')
  const activePct = activeCount > 0 ? '100%' : '0%'

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
            disabled={sending || activeCount === 0}
          >
            ✉ {sending ? 'Sending…' : 'Send Now'}
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
              <div className={styles.recipPill}>✉ All Active Subscribers</div>
              <span className={styles.recipCount}>
                {activeCount} recipient{activeCount === 1 ? '' : 's'}
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
            <div className={styles.statRow}>
              <div className={styles.miniStat}>
                <div className={styles.miniStatVal}>{activeCount}</div>
                <div className={styles.miniStatLabel}>Recipients</div>
              </div>
              <div className={styles.miniStat}>
                <div className={styles.miniStatVal}>{activePct}</div>
                <div className={styles.miniStatLabel}>Active</div>
              </div>
            </div>
            <div className={styles.audienceNote}>
              Sending to all active subscribers.{' '}
              <Link href="/admin/newsletter">Manage list →</Link>
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
                <>Email will be sent immediately to all active subscribers once you click <strong style={{ color: '#0a0a0a' }}>Send Now</strong>.</>
              ) : (
                <>Scheduled sending requires an email provider. Use Send Now for immediate delivery once configured.</>
              )}
            </div>
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
              <div className={styles.sideLabel}>Sender Email</div>
              <input
                className={styles.sideInput}
                type="email"
                value={draft.senderEmail}
                onChange={e => update('senderEmail', e.target.value)}
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
            Ready to send? This email will go to{' '}
            <strong>{activeCount} active subscriber{activeCount === 1 ? '' : 's'}</strong>.
            This action cannot be undone.
            <button
              type="button"
              className={styles.sendConfirmBtn}
              onClick={handleSend}
              disabled={sending || activeCount === 0}
            >
              ✉ {sending ? 'Sending…' : 'Send Now'}
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
