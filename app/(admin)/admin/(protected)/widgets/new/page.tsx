'use client'
// app/(admin)/admin/widgets/new/page.tsx
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createWidget } from '../actions'
import styles from '../../shared.module.css'
import wStyles from '../widgets.module.css'
import { SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const TYPES = [
  { value: 'YOUTUBE',     label: '▶ YouTube',     hint: 'Paste a YouTube video URL or video ID (e.g. dQw4w9WgXcQ)' },
  { value: 'SPOTIFY',     label: '♪ Spotify',     hint: 'Paste a Spotify track/album/playlist URL from open.spotify.com' },
  { value: 'SOUNDCLOUD',  label: '☁ SoundCloud',  hint: 'Paste a public SoundCloud track URL' },
  { value: 'APPLE_MUSIC', label: '♫ Apple Music', hint: 'Paste an Apple Music track/album URL from music.apple.com' },
  { value: 'CUSTOM',      label: '⊞ Custom HTML', hint: 'Paste an iframe src URL (e.g. from a custom embed)' },
]

export default function NewWidgetPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [type,     setType]     = useState<'YOUTUBE'|'SPOTIFY'|'SOUNDCLOUD'|'APPLE_MUSIC'|'CUSTOM'>('YOUTUBE')
  const [title,    setTitle]    = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [position, setPosition] = useState<'LEFT'|'RIGHT'>('RIGHT')
  const [active,   setActive]   = useState(true)
  const [order,    setOrder]    = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)

  const hint = TYPES.find(t => t.value === type)?.hint ?? ''

  const save = () => {
    if (!title.trim() || !embedUrl.trim()) {
      setSaveError('Title and URL are required.')
      return
    }
    setSaveError(null)
    startTransition(async () => {
      const result = await createWidget({ type, title, embedUrl, position, active, order })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      router.push('/admin/widgets')
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.pageTitle}>Add Widget</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Widget'}
        </button>
      </div>

      <SaveErrorBanner error={saveError} onRetry={save} retrying={isPending} />

      <div className={wStyles.formGrid}>
        <div className={wStyles.formMain}>

          {/* Type selector */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Widget Type</label>
            <div className={wStyles.typeTabs}>
              {TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value as any)}
                  className={`${wStyles.typeTab} ${type === t.value ? wStyles.typeActive : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className={styles.hint}>{hint}</p>
          </div>

          {/* Title */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Widget Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={styles.input}
              placeholder="e.g. Now Playing • Afroqueens Mix"
            />
            <p className={styles.hint}>Shown as a small label at the top of the panel.</p>
          </div>

          {/* Embed URL */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>URL / Embed Source *</label>
            <input
              value={embedUrl}
              onChange={e => setEmbedUrl(e.target.value)}
              className={styles.input}
              placeholder={
                type === 'YOUTUBE'     ? 'https://www.youtube.com/watch?v=...' :
                type === 'SPOTIFY'     ? 'https://open.spotify.com/track/...' :
                type === 'SOUNDCLOUD'  ? 'https://soundcloud.com/artist/track' :
                type === 'APPLE_MUSIC' ? 'https://music.apple.com/album/...' :
                'https://example.com/embed/...'
              }
            />
          </div>

          {/* Position */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Panel Position</label>
            <div className={wStyles.positionTabs}>
              <button
                type="button"
                onClick={() => setPosition('LEFT')}
                className={`${wStyles.posTab} ${position === 'LEFT' ? wStyles.posActive : ''}`}
              >
                ← Left Side
              </button>
              <button
                type="button"
                onClick={() => setPosition('RIGHT')}
                className={`${wStyles.posTab} ${position === 'RIGHT' ? wStyles.posActive : ''}`}
              >
                Right Side →
              </button>
            </div>
            <p className={styles.hint}>
              Left or right edge on desktop. Multiple widgets on the same side stack vertically (newest on top). On tablet and mobile they appear in a list above the footer.
            </p>
          </div>

        </div>

        <div className={wStyles.formSide}>
          <div className={wStyles.sideCard}>
            <div className={wStyles.sideTitle}>Settings</div>

            <div className={styles.fieldGroup}>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={e => setActive(e.target.checked)}
                />
                Active (visible on site)
              </label>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Display Order</label>
              <input
                type="number"
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className={styles.input}
                min={0}
              />
              <p className={styles.hint}>Optional manual sort — newest widgets appear first by default.</p>
            </div>
          </div>

          <div className={wStyles.previewCard}>
            <div className={wStyles.previewTitle}>Preview</div>
            <p className={wStyles.previewDesc}>
              On desktop the panel slides in from the <strong>{position.toLowerCase()}</strong> edge.
              On mobile it slides up from the bottom.
            </p>
            <div className={wStyles.previewDemo}>
              <div className={`${wStyles.demoSite}`}>
                {position === 'LEFT' && (
                  <div className={wStyles.demoPanel} style={{ left: 0 }}>
                    <span>◀ {TYPES.find(t=>t.value===type)?.label}</span>
                  </div>
                )}
                <div className={wStyles.demoContent}>Site</div>
                {position === 'RIGHT' && (
                  <div className={wStyles.demoPanel} style={{ right: 0 }}>
                    <span>{TYPES.find(t=>t.value===type)?.label} ▶</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
