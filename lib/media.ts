// lib/media.ts — delete hosted media from Cloudinary or Supabase Storage

import { deleteFromCloudinary } from '@/lib/cloudinary'
import { deleteStorageFile, supabaseStoragePathFromUrl } from '@/lib/supabase'

/** Extract Cloudinary public_id from a delivery URL. */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('res.cloudinary.com')) return null

    const segments = parsed.pathname.split('/').filter(Boolean)
    const uploadIdx = segments.indexOf('upload')
    if (uploadIdx === -1) return null

    let i = uploadIdx + 1
    while (i < segments.length) {
      const seg = segments[i]
      if (seg.includes(',') || /^v\d+$/.test(seg)) {
        i++
        continue
      }
      break
    }

    if (i >= segments.length) return null

    const publicIdWithExt = decodeURIComponent(segments.slice(i).join('/'))
    return publicIdWithExt.replace(/\.[^/.]+$/, '')
  } catch {
    return null
  }
}

export function isHostedMediaUrl(url: string): boolean {
  return Boolean(cloudinaryPublicIdFromUrl(url) || supabaseStoragePathFromUrl(url))
}

/** Delete a file from Cloudinary or Supabase. Skips external URLs (e.g. Unsplash). */
export async function deleteMediaUrl(url: string | null | undefined): Promise<boolean> {
  if (!url?.trim()) return false

  const publicId = cloudinaryPublicIdFromUrl(url)
  if (publicId) {
    try {
      await deleteFromCloudinary(publicId)
      return true
    } catch (err) {
      console.error('[media] Cloudinary delete failed:', publicId, err)
      return false
    }
  }

  const storagePath = supabaseStoragePathFromUrl(url)
  if (storagePath) {
    try {
      await deleteStorageFile(storagePath)
      return true
    } catch (err) {
      console.error('[media] Supabase delete failed:', storagePath, err)
      return false
    }
  }

  return false
}

/** Delete the previous file when a media URL is replaced or cleared. */
export async function deleteMediaIfReplaced(
  oldUrl: string | null | undefined,
  newUrl: string | null | undefined,
): Promise<void> {
  const prev = oldUrl?.trim() || ''
  const next = newUrl?.trim() || ''
  if (prev && prev !== next) {
    await deleteMediaUrl(prev)
  }
}

export async function deleteMediaUrls(urls: (string | null | undefined)[]): Promise<void> {
  const unique = Array.from(new Set(urls.map(u => u?.trim()).filter(Boolean) as string[]))
  await Promise.all(unique.map(deleteMediaUrl))
}
