'use client'
// app/(admin)/admin/blogs/new/page.tsx
import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import slugify from 'slugify'
import { createBlogPost } from '../actions'
import styles from '../../shared.module.css'
import { deleteRemoteMedia } from '@/components/admin/uploads/deleteRemoteMedia'
import { FORM_DRAFT_KEYS } from '@/lib/formDraft'
import { useFormDraft } from '@/hooks/useFormDraft'
import { DraftBanner, DraftHint, SaveErrorBanner } from '@/components/admin/FormStatusBanners'

const Editor = dynamic(() => import('@/components/admin/editors/BlockEditor'), {
  ssr: false,
  loading: () => <div className={styles.editorSkeleton}>Loading editor…</div>,
})

type BlogDraft = {
  title: string
  slug: string
  excerpt: string
  category: string
  author: string
  coverUrl: string
  metaTitle: string
  metaDesc: string
  featured: boolean
  content: any
}

const CATEGORIES = [
  'Cover Story', 'Artist Profile', 'Event Review',
  'Opinion', 'Tech & Music', 'Culture', 'Festival Guide',
]

export default function NewBlogPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle]         = useState('')
  const [slug, setSlug]           = useState('')
  const [excerpt, setExcerpt]     = useState('')
  const [category, setCategory]   = useState('')
  const [author, setAuthor]       = useState('Afroqueens Editorial')
  const [coverUrl, setCoverUrl]   = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc]   = useState('')
  const [featured, setFeatured]   = useState(false)
  const [content, setContent]     = useState<any>(null)
  const [status, setStatus]       = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [initialContent, setInitialContent] = useState<any>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const applyDraft = useCallback((d: BlogDraft) => {
    setTitle(d.title ?? '')
    setSlug(d.slug ?? '')
    setExcerpt(d.excerpt ?? '')
    setCategory(d.category ?? '')
    setAuthor(d.author ?? 'Afroqueens Editorial')
    setCoverUrl(d.coverUrl ?? '')
    setMetaTitle(d.metaTitle ?? '')
    setMetaDesc(d.metaDesc ?? '')
    setFeatured(d.featured ?? false)
    if (d.content) {
      setContent(d.content)
      setInitialContent(d.content)
    }
  }, [])

  const draftData = useMemo<BlogDraft>(() => ({
    title, slug, excerpt, category, author, coverUrl,
    metaTitle, metaDesc, featured, content,
  }), [title, slug, excerpt, category, author, coverUrl, metaTitle, metaDesc, featured, content])

  const { restored, setRestored, savedAt, clear, persist, loaded } = useFormDraft(
    FORM_DRAFT_KEYS.blogNew,
    draftData,
    (d) => applyDraft(d),
  )

  const handleTitle = (val: string) => {
    setTitle(val)
    setSlug(slugify(val, { lower: true, strict: true }))
  }

  const save = (s: 'DRAFT' | 'PUBLISHED') => {
    setStatus(s)
    setSaveError(null)
    startTransition(async () => {
      const result = await createBlogPost({
        title, slug, excerpt, category, author,
        coverImageUrl: coverUrl, content,
        status: s, metaTitle, metaDesc, featured,
      })
      if (!result.ok) {
        setSaveError(result.error)
        persist()
        return
      }
      clear()
      router.push('/admin/blogs')
    })
  }

  const removeCover = async () => {
    if (!coverUrl) return
    try {
      await deleteRemoteMedia(coverUrl)
    } catch { /* ignore */ }
    setCoverUrl('')
  }

  const showEditor = loaded

  return (
    <div className={styles.editorPage}>
      <div className={styles.editorTopbar}>
        <div className={styles.editorTopLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>← Back</button>
          <span className={styles.editorPageTitle}>New Post</span>
        </div>
        <div className={styles.editorTopRight}>
          <label className={styles.featCheck}>
            <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
            Featured
          </label>
          <button onClick={() => save('DRAFT')} disabled={isPending} className={styles.draftBtn}>
            {isPending && status === 'DRAFT' ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={() => save('PUBLISHED')} disabled={isPending} className={styles.publishBtn}>
            {isPending && status === 'PUBLISHED' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>

      <DraftBanner
        show={restored}
        onDismiss={() => setRestored(false)}
        onClear={clear}
        message="Draft restored — including cover URL and editor content."
      />
      <SaveErrorBanner
        error={saveError}
        onRetry={() => save(status)}
        retrying={isPending}
      />
      <DraftHint savedAt={savedAt} hidden={!!saveError} />

      <div className={styles.editorLayout}>
        <div className={styles.editorMain}>
          {coverUrl && (
            <div className={styles.coverPreview}>
              <img src={coverUrl} alt="Cover" />
              <button type="button" onClick={removeCover} className={styles.removeCover}>✕</button>
            </div>
          )}
          <input
            placeholder="Cover image URL (paste Cloudinary URL or upload below)"
            value={coverUrl}
            onChange={e => setCoverUrl(e.target.value)}
            className={styles.coverInput}
          />
          <input
            placeholder="Add title"
            value={title}
            onChange={e => handleTitle(e.target.value)}
            className={styles.titleInput}
          />
          <div className={styles.slugRow}>
            <span className={styles.slugLabel}>Permalink:</span>
            <span className={styles.slugVal}>
              afroqueens.fm/blog/<strong>{slug || 'post-slug'}</strong>
            </span>
            <button
              className={styles.slugEdit}
              onClick={() => { const v = prompt('Edit slug:', slug); if (v) setSlug(v) }}
            >
              Edit
            </button>
          </div>
          <textarea
            placeholder="Short excerpt (shown in post cards)…"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            className={styles.excerptInput}
            rows={2}
          />
          <div className={styles.editorBox}>
            {showEditor && (
              <Editor
                key={initialContent ? 'draft' : 'new'}
                initialContent={initialContent ?? undefined}
                onChange={setContent}
              />
            )}
          </div>
        </div>

        <div className={styles.editorSidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideLabel}>Category</div>
            <select value={category} onChange={e => setCategory(e.target.value)} className={styles.sideSelect}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.sideSection}>
            <div className={styles.sideLabel}>Author</div>
            <input value={author} onChange={e => setAuthor(e.target.value)} className={styles.sideInput} />
          </div>
          <div className={styles.sideDivider} />
          <div className={styles.sideSection}>
            <div className={styles.sideLabel}>SEO Title</div>
            <input placeholder="Defaults to post title" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className={styles.sideInput} />
          </div>
          <div className={styles.sideSection}>
            <div className={styles.sideLabel}>SEO Description</div>
            <textarea placeholder="Meta description…" value={metaDesc} onChange={e => setMetaDesc(e.target.value)} className={styles.sideTextarea} rows={3} />
            <div className={styles.charCount}>{metaDesc.length}/160</div>
          </div>
        </div>
      </div>
    </div>
  )
}
