// lib/formDraft.ts — browser localStorage drafts for admin forms (client-only)

export function loadFormDraft<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function saveFormDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ...data, _savedAt: new Date().toISOString() }),
    )
  } catch {
    // storage full or private mode
  }
}

export function clearFormDraft(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const FORM_DRAFT_KEYS = {
  artistNew: 'afroqueens-draft-artist-new',
  blogNew: 'afroqueens-draft-blog-new',
  blogEdit: (id: string) => `afroqueens-draft-blog-edit-${id}`,
  episodeNew: 'afroqueens-draft-episode-new',
  episodeEdit: (id: string) => `afroqueens-draft-episode-edit-${id}`,
} as const
