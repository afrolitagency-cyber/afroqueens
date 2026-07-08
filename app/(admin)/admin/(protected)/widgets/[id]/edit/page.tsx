'use client'
// app/(admin)/admin/widgets/[id]/edit/page.tsx
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateWidget } from '../../actions'
import styles from '../../../shared.module.css'
import wStyles from '../../widgets.module.css'
import { SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const TYPES = [
  { value: 'YOUTUBE',     label: '▶ YouTube',     hint: 'Paste a YouTube video URL or video ID' },
  { value: 'SPOTIFY',     label: '♪ Spotify',     hint: 'Paste a Spotify track/album/playlist URL' },
  { value: 'SOUNDCLOUD',  label: '☁ SoundCloud',  hint: 'Paste a public SoundCloud track URL' },
  { value: 'APPLE_MUSIC', label: '♫ Apple Music', hint: 'Paste an Apple Music URL' },
  { value: 'CUSTOM',      label: '⊞ Custom',      hint: 'Paste an iframe src URL' },
]

export default function EditWidgetPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  const [type,     setType]     = useState<'YOUTUBE'|'SPOTIFY'|'SOUNDCLOUD'|'APPLE_MUSIC'|'CUSTOM'>('YOUTUBE')
  const [title,    setTitle]    = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [position, setPosition] = useState<'LEFT'|'RIGHT'>('RIGHT')
  const [active,   setActive]   = useState(true)
  const [order,    setOrder]    = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/admin/widgets/${id}`)
      .then(r => r.json())
      .then(w => {
        setType(w.type); setTitle(w.title); setEmbedUrl(w.embedUrl)
        setPosition(w.position); setActive(w.active); setOrder(w.order)
        setLoading(false)
      })
  }, [id])

  const save = () => {
    if (!title.trim() || !embedUrl.trim()) {
      setSaveError('Title and URL are required.')
      return
    }
    setSaveError(null)
    startTransition(async () => {
      const result = await updateWidget(id, { type, title, embedUrl, position, active, order })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      router.push('/admin/widgets')
    })
  }

  if (loading) return <div className={styles.page}><p>Loading…</p></div>

  const hint = TYPES.find(t => t.value === type)?.hint ?? ''

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
        <h1 className={styles.pageTitle}>Edit Widget</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <SaveErrorBanner error={saveError} onRetry={save} retrying={isPending} />

      <div className={wStyles.formGrid}>
        <div className={wStyles.formMain}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Widget Type</label>
            <div className={wStyles.typeTabs}>
              {TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setType(t.value as any)}
                  className={`${wStyles.typeTab} ${type === t.value ? wStyles.typeActive : ''}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <p className={styles.hint}>{hint}</p>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Widget Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>URL / Embed Source *</label>
            <input value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} className={styles.input} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Panel Position</label>
            <div className={wStyles.positionTabs}>
              <button type="button" onClick={() => setPosition('LEFT')}
                className={`${wStyles.posTab} ${position === 'LEFT' ? wStyles.posActive : ''}`}>
                ← Left Side
              </button>
              <button type="button" onClick={() => setPosition('RIGHT')}
                className={`${wStyles.posTab} ${position === 'RIGHT' ? wStyles.posActive : ''}`}>
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
                <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                Active (visible on site)
              </label>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Display Order</label>
              <input type="number" value={order} onChange={e => setOrder(Number(e.target.value))}
                className={styles.input} min={0} />
              <p className={styles.hint}>Optional manual sort — newest widgets appear first by default.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
