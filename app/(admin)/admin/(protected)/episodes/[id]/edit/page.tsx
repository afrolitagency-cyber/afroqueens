'use client'
// app/(admin)/admin/episodes/[id]/edit/page.tsx
import { useEffect, useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { updateEpisode } from '../../actions'
import CloudinaryUpload from '@/components/admin/uploads/CloudinaryUpload'
import SupabaseAudioUpload from '@/components/admin/uploads/SupabaseAudioUpload'
import styles from '../../episodes.module.css'
import { FORM_DRAFT_KEYS } from '@/lib/formDraft'
import { useFormDraft } from '@/hooks/useFormDraft'
import { DraftBanner, DraftHint, SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const CATEGORIES = [
  { value: 'INTERVIEWS',        label: 'Interviews' },
  { value: 'EVENT_COVERAGE',    label: 'Event Coverage' },
  { value: 'DEEP_DIVES',        label: 'Deep Dives' },
  { value: 'PANEL_DISCUSSIONS', label: 'Panel Discussions' },
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

export default function EditEpisodePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [dbLoaded, setDbLoaded] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

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

  useEffect(() => {
    fetch(`/api/admin/episodes/${id}`)
      .then(r => r.json())
      .then(ep => {
        setNumber(String(ep.number ?? ''))
        setTitle(ep.title ?? ''); setSubtitle(ep.subtitle ?? ''); setDesc(ep.description ?? '')
        setDuration(ep.duration ?? '')
        setRelDate(ep.releaseDate ? new Date(ep.releaseDate).toISOString().split('T')[0] : '')
        setCategory(ep.category ?? 'INTERVIEWS')
        setAudioUrl(ep.audioUrl ?? ''); setCoverUrl(ep.coverImageUrl ?? '')
        setFeatured(ep.featured ?? false)
        setLoading(false)
        setDbLoaded(true)
      })
  }, [id])

  const draftData = useMemo<EpisodeDraft>(() => ({
    number, title, subtitle, description, duration, releaseDate,
    category, audioUrl, coverUrl, featured,
  }), [number, title, subtitle, description, duration, releaseDate, category, audioUrl, coverUrl, featured])

  const applyLocalDraft = useCallback((d: EpisodeDraft) => {
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

  const { restored, setRestored, savedAt, clear, persist } = useFormDraft(
    FORM_DRAFT_KEYS.episodeEdit(id),
    draftData,
    applyLocalDraft,
    dbLoaded,
  )

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateEpisode(id, {
        number: parseInt(number),
        title, subtitle: subtitle || undefined, description: description || undefined,
        duration, releaseDate: new Date(releaseDate),
        category: category as any,
        audioUrl: audioUrl || undefined, coverImageUrl: coverUrl || undefined,
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

  if (loading) return <div className={styles.page}><p>Loading…</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.back}>← Back</button>
        <h1 className={styles.title}>Edit Episode</h1>
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <DraftBanner
        show={restored}
        onDismiss={() => setRestored(false)}
        onClear={clear}
        message="Unsaved local draft restored."
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
              <input type="number" value={number} onChange={e => setNumber(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Duration *</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} className={styles.input} placeholder="58:22" />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Subtitle / Tags</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className={styles.input} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Description</label>
            <textarea value={description} onChange={e => setDesc(e.target.value)} className={styles.textarea} rows={4} />
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
                Featured episode
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
