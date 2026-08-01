// lib/mediaAssetLabels.ts — pure display helpers safe for client components

/** Cloudinary public ids often look like random hashes with no extension. */
export function looksLikeStorageId(name: string | null | undefined): boolean {
  if (!name?.trim()) return true
  const base = name.trim().split(/[/\\]/).pop() || ''
  if (/\.(jpe?g|png|gif|webp|avif|svg)$/i.test(base)) return false
  return /^[a-z0-9_-]{8,}$/i.test(base)
}

export function titleFromFilename(filename: string | null | undefined): string | null {
  if (!filename?.trim() || looksLikeStorageId(filename)) return null
  const base = filename.trim().split(/[/\\]/).pop() || filename.trim()
  return base.replace(/\.[^.]+$/, '') || null
}

export function mediaDisplayName(asset: {
  title?: string | null
  filename?: string | null
}): string {
  if (asset.title?.trim()) return asset.title.trim()
  const fromFile = titleFromFilename(asset.filename)
  if (fromFile) return fromFile
  return 'Untitled'
}

export function mediaFileLabel(asset: {
  title?: string | null
  filename?: string | null
}): string {
  if (asset.filename?.trim() && !looksLikeStorageId(asset.filename)) {
    return asset.filename.trim().split(/[/\\]/).pop() || asset.filename.trim()
  }
  if (asset.title?.trim()) return asset.title.trim()
  return '—'
}
