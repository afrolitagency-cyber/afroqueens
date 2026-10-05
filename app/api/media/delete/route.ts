// app/api/media/delete/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUploaderApi } from '@/lib/authz'
import { deleteMediaUrl, isHostedMediaUrl } from '@/lib/media'
import type { ArtistProfileFields } from '@/lib/artistProfile'

/**
 * Artists may only delete files that exist in their pending submission and are not live,
 * so a draft edit can't remove media the public page (or anyone else) still uses.
 */
async function artistMayDelete(artistId: string, url: string): Promise<boolean> {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { profileImageUrl: true, coverImageUrl: true, customAudioUrl: true, pendingProfile: true },
  })
  if (!artist) return false
  const pending = (artist.pendingProfile ?? null) as Partial<ArtistProfileFields> | null
  const pendingUrls = [pending?.profileImageUrl, pending?.coverImageUrl, pending?.customAudioUrl]
  const liveUrls = [artist.profileImageUrl, artist.coverImageUrl, artist.customAudioUrl]
  return pendingUrls.includes(url) && !liveUrls.includes(url)
}

export async function POST(req: NextRequest) {
  const auth = await requireUploaderApi()
  if (auth.response) return auth.response

  let url: string
  try {
    const body = await req.json()
    url = body?.url
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  if (!isHostedMediaUrl(url)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  if (!auth.isStaff && !(await artistMayDelete(auth.artistId!, url))) {
    // Leave the file in place; the client still clears the field from the draft.
    return NextResponse.json({ ok: true, skipped: true })
  }

  const deleted = await deleteMediaUrl(url)
  if (!deleted) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
