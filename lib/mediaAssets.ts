// lib/mediaAssets.ts — central media library helpers
import { prisma } from '@/lib/prisma'
import { cloudinaryPublicIdFromUrl, deleteMediaUrl } from '@/lib/media'
import {
  looksLikeStorageId,
  titleFromFilename,
} from '@/lib/mediaAssetLabels'

export {
  looksLikeStorageId,
  titleFromFilename,
  mediaDisplayName,
  mediaFileLabel,
} from '@/lib/mediaAssetLabels'

export const MEDIA_FOLDERS = ['artists', 'blog', 'gallery', 'episodes', 'events'] as const
export type MediaFolder = (typeof MEDIA_FOLDERS)[number]

export function isMediaFolder(value: string): value is MediaFolder {
  return (MEDIA_FOLDERS as readonly string[]).includes(value)
}

export async function recordMediaAsset(input: {
  url: string
  publicId: string
  folder: MediaFolder
  filename?: string | null
  title?: string | null
  alt?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
  bytes?: number | null
  mimeType?: string | null
  uploadedBy?: string | null
}) {
  const filename = input.filename ?? null
  const title = input.title?.trim() || titleFromFilename(filename)

  return prisma.mediaAsset.upsert({
    where: { publicId: input.publicId },
    create: {
      url: input.url,
      publicId: input.publicId,
      folder: input.folder,
      filename,
      title,
      alt: input.alt ?? null,
      caption: input.caption ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      bytes: input.bytes ?? null,
      mimeType: input.mimeType ?? null,
      uploadedBy: input.uploadedBy ?? null,
    },
    update: {
      url: input.url,
      folder: input.folder,
      filename: filename ?? undefined,
      title: title ?? undefined,
      width: input.width ?? undefined,
      height: input.height ?? undefined,
      bytes: input.bytes ?? undefined,
      mimeType: input.mimeType ?? undefined,
    },
  })
}

/** True if this URL is tracked in the media library (shared asset — don't auto-destroy). */
export async function isLibraryMediaUrl(url: string | null | undefined): Promise<boolean> {
  if (!url?.trim()) return false
  const publicId = cloudinaryPublicIdFromUrl(url)
  if (publicId) {
    const byId = await prisma.mediaAsset.findUnique({ where: { publicId }, select: { id: true } })
    if (byId) return true
  }
  const byUrl = await prisma.mediaAsset.findFirst({ where: { url }, select: { id: true } })
  return Boolean(byUrl)
}

export async function deleteMediaAssetById(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } })
  if (!asset) return { ok: false, error: 'Asset not found.' }

  await deleteMediaUrl(asset.url)
  await prisma.mediaAsset.delete({ where: { id } }).catch(() => null)
  return { ok: true }
}

/** Collect image URLs already stored on content records for backfill. */
export async function collectContentImageUrls(): Promise<
  Array<{ url: string; folder: MediaFolder; title?: string | null }>
> {
  const [artists, releases, blogs, gallery, episodes, events] = await Promise.all([
    prisma.artist.findMany({
      where: { OR: [{ profileImageUrl: { not: null } }, { coverImageUrl: { not: null } }] },
      select: { name: true, profileImageUrl: true, coverImageUrl: true },
    }),
    prisma.artistRelease.findMany({ where: { coverUrl: { not: null } }, select: { title: true, coverUrl: true } }),
    prisma.blogPost.findMany({ where: { coverImageUrl: { not: null } }, select: { title: true, coverImageUrl: true } }),
    prisma.galleryItem.findMany({ select: { label: true, imageUrl: true } }),
    prisma.episode.findMany({ where: { coverImageUrl: { not: null } }, select: { title: true, coverImageUrl: true } }),
    prisma.event.findMany({ where: { coverImageUrl: { not: null } }, select: { title: true, coverImageUrl: true } }),
  ])

  const rows: Array<{ url: string; folder: MediaFolder; title?: string | null }> = []
  for (const a of artists) {
    if (a.profileImageUrl) rows.push({ url: a.profileImageUrl, folder: 'artists', title: a.name })
    if (a.coverImageUrl) rows.push({ url: a.coverImageUrl, folder: 'artists', title: `${a.name} cover` })
  }
  for (const r of releases) {
    if (r.coverUrl) rows.push({ url: r.coverUrl, folder: 'artists', title: r.title })
  }
  for (const b of blogs) {
    if (b.coverImageUrl) rows.push({ url: b.coverImageUrl, folder: 'blog', title: b.title })
  }
  for (const g of gallery) {
    rows.push({ url: g.imageUrl, folder: 'gallery', title: g.label })
  }
  for (const e of episodes) {
    if (e.coverImageUrl) rows.push({ url: e.coverImageUrl, folder: 'episodes', title: e.title })
  }
  for (const e of events) {
    if (e.coverImageUrl) rows.push({ url: e.coverImageUrl, folder: 'events', title: e.title })
  }
  return rows
}

export async function backfillMediaLibrary(): Promise<{ created: number; skipped: number; titled: number }> {
  const rows = await collectContentImageUrls()
  let created = 0
  let skipped = 0
  let titled = 0

  for (const row of rows) {
    const publicId = cloudinaryPublicIdFromUrl(row.url)
    if (!publicId) {
      skipped++
      continue
    }
    const existing = await prisma.mediaAsset.findUnique({ where: { publicId } })
    if (existing) {
      if (!existing.title?.trim() && row.title?.trim()) {
        await prisma.mediaAsset.update({
          where: { id: existing.id },
          data: { title: row.title.trim() },
        })
        titled++
      } else {
        skipped++
      }
      continue
    }
    const filename = publicId.split('/').pop() ?? null
    await prisma.mediaAsset.create({
      data: {
        url: row.url,
        publicId,
        folder: row.folder,
        filename: looksLikeStorageId(filename) ? null : filename,
        title: row.title?.trim() || titleFromFilename(filename),
      },
    })
    created++
  }

  return { created, skipped, titled }
}
