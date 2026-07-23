'use server'
// app/(admin)/admin/artists/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import slugify from 'slugify'
import { deleteMediaIfReplaced, deleteMediaUrls } from '@/lib/media'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'
import { normalizeArtistUrl } from '@/lib/artistLinks'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'

export type { ActionResult }

interface ArtistPayload {
  name: string
  genre: string
  location: string
  monthlyListeners?: string
  bio?: string
  profileImageUrl?: string
  streamSource: 'SPOTIFY' | 'YOUTUBE' | 'SOUNDCLOUD' | 'CUSTOM'
  spotifyTrackId?: string
  youtubeVideoId?: string
  soundcloudUrl?: string
  customAudioUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  tiktokUrl?: string
  facebookUrl?: string
  releaseUrl?: string
  featured?: boolean
  order?: number
}

function linkData(data: ArtistPayload) {
  return {
    instagramUrl: normalizeArtistUrl(data.instagramUrl),
    twitterUrl:   normalizeArtistUrl(data.twitterUrl),
    tiktokUrl:    normalizeArtistUrl(data.tiktokUrl),
    facebookUrl:  normalizeArtistUrl(data.facebookUrl),
    releaseUrl:   normalizeArtistUrl(data.releaseUrl),
  }
}

function streamData(data: ArtistPayload) {
  return {
    streamSource:   data.streamSource,
    youtubeVideoId: extractYoutubeVideoId(data.youtubeVideoId) ?? null,
    spotifyTrackId: extractSpotifyTrackId(data.spotifyTrackId) ?? null,
    soundcloudUrl:  data.soundcloudUrl?.trim() || null,
    customAudioUrl: data.customAudioUrl?.trim() || null,
  }
}

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
}

export async function createArtist(data: ArtistPayload): Promise<ActionResult> {
  await requireAuth()

  if (!data.name?.trim() || !data.genre?.trim() || !data.location?.trim()) {
    return actionErr('Name, genre, and location are required.')
  }

  const slug = slugify(data.name, { lower: true, strict: true })

  try {
    await withDbRetry(() =>
      prisma.artist.create({
        data: {
          name:             data.name,
          slug,
          genre:            data.genre,
          location:         data.location,
          monthlyListeners: data.monthlyListeners ?? null,
          bio:              data.bio ?? null,
          profileImageUrl:  data.profileImageUrl ?? null,
          ...streamData(data),
          ...linkData(data),
          featured:         data.featured ?? false,
          order:            data.order ?? 0,
        },
      }),
    )

    revalidatePath('/artists')
    revalidatePath(`/artists/${slug}`)
    revalidatePath('/')
    revalidatePath('/admin/artists')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateArtist(id: string, data: ArtistPayload): Promise<ActionResult> {
  await requireAuth()

  const existing = await prisma.artist.findUnique({
    where: { id },
    select: { profileImageUrl: true, customAudioUrl: true, slug: true },
  })

  try {
    await withDbRetry(() =>
      prisma.artist.update({
        where: { id },
        data: {
          name:             data.name,
          genre:            data.genre,
          location:         data.location,
          monthlyListeners: data.monthlyListeners ?? null,
          bio:              data.bio ?? null,
          profileImageUrl:  data.profileImageUrl ?? null,
          ...streamData(data),
          ...linkData(data),
          featured:         data.featured ?? false,
          order:            data.order ?? 0,
        },
      }),
    )

    await deleteMediaIfReplaced(existing?.profileImageUrl, data.profileImageUrl)
    await deleteMediaIfReplaced(existing?.customAudioUrl, data.customAudioUrl)

    revalidatePath('/artists')
    if (existing?.slug) revalidatePath(`/artists/${existing.slug}`)
    revalidatePath('/')
    revalidatePath('/admin/artists')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteArtist(id: string) {
  await requireAuth()
  const artist = await prisma.artist.findUnique({
    where: { id },
    select: { profileImageUrl: true, customAudioUrl: true },
  })
  await prisma.artist.delete({ where: { id } })
  await deleteMediaUrls([artist?.profileImageUrl, artist?.customAudioUrl])
  revalidatePath('/artists')
  revalidatePath('/')
}
