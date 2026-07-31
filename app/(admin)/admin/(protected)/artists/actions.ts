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
import type { ReleaseType } from '@prisma/client'

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

export interface ReleaseTrackPayload {
  number: number
  title: string
  featuredArtists?: string
  duration?: string
  explicit?: boolean
  listenUrl?: string
}

export interface ArtistReleasePayload {
  title: string
  type: ReleaseType
  year: number
  label?: string
  description?: string
  coverUrl?: string
  listenUrl?: string
  order?: number
  tracks: ReleaseTrackPayload[]
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

function releaseData(data: ArtistReleasePayload) {
  return {
    title:       data.title.trim(),
    type:        data.type,
    year:        data.year,
    label:       data.label?.trim() || null,
    description: data.description?.trim() || null,
    coverUrl:    data.coverUrl?.trim() || null,
    listenUrl:   normalizeArtistUrl(data.listenUrl),
    order:       data.order ?? 0,
  }
}

function trackData(track: ReleaseTrackPayload, index: number) {
  return {
    number:          track.number || index + 1,
    title:           track.title.trim(),
    featuredArtists: track.featuredArtists?.trim() || null,
    duration:        track.duration?.trim() || null,
    explicit:        track.explicit ?? false,
    listenUrl:       normalizeArtistUrl(track.listenUrl),
  }
}

function validateRelease(data: ArtistReleasePayload): string | null {
  if (!data.title?.trim()) return 'Release title is required.'
  if (!Number.isInteger(data.year) || data.year < 1900 || data.year > 2100) {
    return 'Enter a valid release year.'
  }
  if (!data.tracks.length || data.tracks.some(track => !track.title?.trim())) {
    return 'Add at least one track and give every track a title.'
  }
  return null
}

function revalidateArtist(artistSlug?: string) {
  revalidatePath('/artists')
  if (artistSlug) revalidatePath(`/artists/${artistSlug}`)
  revalidatePath('/admin/artists')
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

export async function createArtistRelease(
  artistId: string,
  data: ArtistReleasePayload,
): Promise<ActionResult> {
  await requireAuth()
  const validationError = validateRelease(data)
  if (validationError) return actionErr(validationError)

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { slug: true },
  })
  if (!artist) return actionErr('Artist not found.')

  try {
    await withDbRetry(() =>
      prisma.artistRelease.create({
        data: {
          artistId,
          ...releaseData(data),
          tracks: {
            create: data.tracks.map(trackData),
          },
        },
      }),
    )
    revalidateArtist(artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateArtistRelease(
  releaseId: string,
  data: ArtistReleasePayload,
): Promise<ActionResult> {
  await requireAuth()
  const validationError = validateRelease(data)
  if (validationError) return actionErr(validationError)

  const existing = await prisma.artistRelease.findUnique({
    where: { id: releaseId },
    select: { coverUrl: true, artist: { select: { slug: true } } },
  })
  if (!existing) return actionErr('Release not found.')

  try {
    await withDbRetry(() =>
      prisma.$transaction([
        prisma.releaseTrack.deleteMany({ where: { releaseId } }),
        prisma.artistRelease.update({
          where: { id: releaseId },
          data: {
            ...releaseData(data),
            tracks: {
              create: data.tracks.map(trackData),
            },
          },
        }),
      ]),
    )
    await deleteMediaIfReplaced(existing.coverUrl, data.coverUrl)
    revalidateArtist(existing.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteArtistRelease(releaseId: string): Promise<ActionResult> {
  await requireAuth()
  const release = await prisma.artistRelease.findUnique({
    where: { id: releaseId },
    select: { coverUrl: true, artist: { select: { slug: true } } },
  })
  if (!release) return actionErr('Release not found.')

  try {
    await withDbRetry(() => prisma.artistRelease.delete({ where: { id: releaseId } }))
    await deleteMediaUrls([release.coverUrl])
    revalidateArtist(release.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
