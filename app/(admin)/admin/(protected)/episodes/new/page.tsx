'use client'
// app/(admin)/admin/episodes/new/page.tsx
import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createEpisode } from '../actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import styles from '../episodes.module.css'
import { FORM_DRAFT_KEYS } from '@/lib/formDraft'
import { useFormDraft } from '@/hooks/useFormDraft'
import { DraftBanner, DraftHint, SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const CATEGORIES = [
  { value: 'INTERVIEWS',         label: 'Interviews' },
  { value: 'EVENT_COVERAGE',     label: 'Event Coverage' },
  { value: 'DEEP_DIVES',         label: 'Deep Dives' },
  { value: 'PANEL_DISCUSSIONS',  label: 'Panel Discussions' },
]

type EpisodeDraft = {
  number: string
  title: string
  subtitle: string
  description: string
  duration: string
  releaseDate: string
  category: string
  audioUrl: string
  coverUrl: string
  featured: boolean
}

export default function NewEpisodePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [number, setNumber]       = useState('')
  const [title, setTitle]         = useState('')
  const [subtitle, setSubtitle]   = useState('')
  const [description, setDesc]    = useState('')
  const [duration, setDuration]   = useState('')
  const [releaseDate, setRelDate] = useState('')
  const [category, setCategory]   = useState('INTERVIEWS')
  const [audioUrl, setAudioUrl]   = useState('')
  const [coverUrl, setCoverUrl]   = useState('')
  const [featured, setFeatured]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const applyDraft = useCallback((d: EpisodeDraft) => {
    setNumber(d.number ?? '')
    setTitle(d.title ?? '')
    setSubtitle(d.subtitle ?? '')
    setDesc(d.description ?? '')
    setDuration(d.duration ?? '')
    setRelDate(d.releaseDate ?? '')
    setCategory(d.category ?? 'INTERVIEWS')
    setAudioUrl(d.audioUrl ?? '')
    setCoverUrl(d.coverUrl ?? '')
    setFeatured(d.featured ?? false)
  }, [])

  const draftData = useMemo<EpisodeDraft>(() => ({
    number, title, subtitle, description, duration, releaseDate,
    category, audioUrl, coverUrl, featured,
  }), [number, title, subtitle, description, duration, releaseDate, category, audioUrl, coverUrl, featured])

  const { restored, setRestored, savedAt, clear, persist } = useFormDraft(
    FORM_DRAFT_KEYS.episodeNew,
    draftData,
    applyDraft,
  )

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await createEpisode({
        number:       parseInt(number),
        title,
        subtitle:     subtitle || undefined,
        description:  description || undefined,
        duration,
        releaseDate:  new Date(releaseDate),
        category:     category as any,
        audioUrl:     audioUrl || undefined,
        coverImageUrl: coverUrl || undefined,
        featured,
      })
      if (!result.ok) {
        setSaveError(result.error)
        persist()
        return
      }
      clear()
      router.push('/admin/episodes')
    })
  }

  const discardDraft = () => {
    clear()
    setNumber(''); setTitle(''); setSubtitle(''); setDesc('')
    setDuration(''); setRelDate(''); setCategory('INTERVIEWS')
    setAudioUrl(''); setCoverUrl(''); setFeatured(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.back}>← Back</button>
        <h1 className={styles.title}>New Episode</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Episode'}
        </button>
      </div>

      <DraftBanner
        show={restored}
        onDismiss={() => setRestored(false)}
        onClear={discardDraft}
        message="Draft restored — including cover and audio URLs."
      />
      <SaveErrorBanner error={saveError} onRetry={save} retrying={isPending} />
      <DraftHint savedAt={savedAt} hidden={!!saveError} />

      <div className={styles.formGrid}>
        <div className={styles.formMain}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Episode Cover</label>
            <CloudinaryUpload folder="episodes" value={coverUrl} onChange={setCoverUrl} />
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Episode Number *</label>
              <input type="number" value={number} onChange={e => setNumber(e.target.value)} className={styles.input} placeholder="e.g. 48" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Duration *</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} className={styles.input} placeholder="e.g. 58:22" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={styles.input} placeholder="Episode title" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Subtitle / Tags</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className={styles.input} placeholder="e.g. Production · Afrobeats · Behind the Music" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} className={styles.textarea} rows={4} placeholder="Episode description…" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Episode Audio (MP3)</label>
            <SupabaseAudioUpload folder="episodes" value={audioUrl} onChange={setAudioUrl} />
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>Details</div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={styles.select}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Release Date</label>
              <input type="date" value={releaseDate} onChange={e => setRelDate(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                Featured episode (shown first)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
