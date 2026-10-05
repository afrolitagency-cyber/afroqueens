'use server'
// app/(admin)/admin/artists/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/authz'
import slugify from 'slugify'
import { deleteMediaIfReplaced, deleteMediaUrls } from '@/lib/media'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'
import { normalizeArtistUrl } from '@/lib/artistLinks'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'
import { Prisma, type ReleaseType } from '@prisma/client'

export type { ActionResult }

interface ArtistPayload {
  name: string
  genre: string
  location: string
  monthlyListeners?: string
  bio?: string
  profileImageUrl?: string
  coverImageUrl?: string
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
  if (!data.coverUrl?.trim()) return 'Release cover art is required.'
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

export async function createArtist(data: ArtistPayload): Promise<ActionResult<{ id: string }>> {
  await requireStaff()

  if (!data.name?.trim() || !data.genre?.trim() || !data.location?.trim()) {
    return actionErr('Name, genre, and location are required.')
  }

  const slug = slugify(data.name, { lower: true, strict: true })

  try {
    const artist = await withDbRetry(() =>
      prisma.artist.create({
        data: {
          name:             data.name,
          slug,
          genre:            data.genre,
          location:         data.location,
          monthlyListeners: data.monthlyListeners ?? null,
          bio:              data.bio ?? null,
          profileImageUrl:  data.profileImageUrl ?? null,
          coverImageUrl:    data.coverImageUrl ?? null,
          ...streamData(data),
          ...linkData(data),
          featured:         data.featured ?? false,
          order:            data.order ?? 0,
        },
        select: { id: true },
      }),
    )

    revalidatePath('/artists')
    revalidatePath(`/artists/${slug}`)
    revalidatePath('/')
    revalidatePath('/admin/artists')
    return actionOk({ id: artist.id })
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateArtist(id: string, data: ArtistPayload): Promise<ActionResult> {
  await requireStaff()

  const existing = await prisma.artist.findUnique({
    where: { id },
    select: { profileImageUrl: true, coverImageUrl: true, customAudioUrl: true, slug: true },
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
          coverImageUrl:    data.coverImageUrl ?? null,
          ...streamData(data),
          ...linkData(data),
          featured:         data.featured ?? false,
          order:            data.order ?? 0,
          // Admin live edit supersedes any pending artist submission
          pendingProfile:   Prisma.DbNull,
          reviewStatus:     'NONE',
          reviewNote:       null,
        },
      }),
    )

    await deleteMediaIfReplaced(existing?.profileImageUrl, data.profileImageUrl)
    await deleteMediaIfReplaced(existing?.coverImageUrl, data.coverImageUrl)
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
  await requireStaff()
  const artist = await prisma.artist.findUnique({
    where: { id },
    select: { profileImageUrl: true, coverImageUrl: true, customAudioUrl: true },
  })
  await prisma.artist.delete({ where: { id } })
  await deleteMediaUrls([artist?.profileImageUrl, artist?.coverImageUrl, artist?.customAudioUrl])
  revalidatePath('/artists')
  revalidatePath('/')
}

export async function createArtistRelease(
  artistId: string,
  data: ArtistReleasePayload,
): Promise<ActionResult> {
  await requireStaff()
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
  await requireStaff()
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
  await requireStaff()
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

export type ArtistMomentPayload = {
  imageUrl: string
  caption?: string
  linkUrl?: string
  order?: number
}

export async function createArtistMoment(
  artistId: string,
  data: ArtistMomentPayload,
): Promise<ActionResult> {
  await requireStaff()
  const imageUrl = data.imageUrl?.trim()
  if (!imageUrl) return actionErr('Upload an image for this moment.')

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { slug: true },
  })
  if (!artist) return actionErr('Artist not found.')

  try {
    await withDbRetry(() =>
      prisma.artistMoment.create({
        data: {
          artistId,
          imageUrl,
          caption: data.caption?.trim() || null,
          linkUrl: normalizeArtistUrl(data.linkUrl),
          order: data.order ?? 0,
        },
      }),
    )
    revalidateArtist(artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateArtistMoment(
  momentId: string,
  data: ArtistMomentPayload,
): Promise<ActionResult> {
  await requireStaff()
  const imageUrl = data.imageUrl?.trim()
  if (!imageUrl) return actionErr('Upload an image for this moment.')

  const existing = await prisma.artistMoment.findUnique({
    where: { id: momentId },
    select: { imageUrl: true, artist: { select: { slug: true } } },
  })
  if (!existing) return actionErr('Moment not found.')

  try {
    await withDbRetry(() =>
      prisma.artistMoment.update({
        where: { id: momentId },
        data: {
          imageUrl,
          caption: data.caption?.trim() || null,
          linkUrl: normalizeArtistUrl(data.linkUrl),
          order: data.order ?? 0,
        },
      }),
    )
    await deleteMediaIfReplaced(existing.imageUrl, imageUrl)
    revalidateArtist(existing.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteArtistMoment(momentId: string): Promise<ActionResult> {
  await requireStaff()
  const moment = await prisma.artistMoment.findUnique({
    where: { id: momentId },
    select: { imageUrl: true, artist: { select: { slug: true } } },
  })
  if (!moment) return actionErr('Moment not found.')

  try {
    await withDbRetry(() => prisma.artistMoment.delete({ where: { id: momentId } }))
    await deleteMediaUrls([moment.imageUrl])
    revalidateArtist(moment.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
