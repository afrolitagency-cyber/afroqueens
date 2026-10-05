// app/(artist)/artist/(portal)/actions.ts
'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import { actionOk, actionErr, type ActionResult } from '@/lib/actions'
import { normalizeArtistUrl } from '@/lib/artistLinks'
import { hashInviteToken } from '@/lib/artistInvite'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'
import { deleteMediaIfReplaced, deleteMediaUrls } from '@/lib/media'
import type { ArtistProfileFields, StreamSourceValue } from '@/lib/artistProfile'
import type {
  ArtistReleasePayload,
} from '@/app/(admin)/admin/(protected)/artists/actions'
import type { ReleaseType } from '@prisma/client'

async function requireArtistSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/artist/login')
  if (session.user.role !== 'ARTIST' || !session.user.artistId) {
    redirect('/artist/login')
  }
  return session
}

function sanitizeProfile(data: ArtistProfileFields): ArtistProfileFields {
  return {
    name: data.name.trim(),
    genre: data.genre.trim(),
    location: data.location.trim(),
    monthlyListeners: data.monthlyListeners?.trim() || null,
    bio: data.bio?.trim() || null,
    profileImageUrl: data.profileImageUrl?.trim() || null,
    coverImageUrl: data.coverImageUrl?.trim() || null,
    streamSource: data.streamSource,
    spotifyTrackId: extractSpotifyTrackId(data.spotifyTrackId ?? undefined),
    youtubeVideoId: extractYoutubeVideoId(data.youtubeVideoId ?? undefined),
    soundcloudUrl: data.soundcloudUrl?.trim() || null,
    customAudioUrl: data.customAudioUrl?.trim() || null,
    instagramUrl: normalizeArtistUrl(data.instagramUrl ?? undefined),
    twitterUrl: normalizeArtistUrl(data.twitterUrl ?? undefined),
    tiktokUrl: normalizeArtistUrl(data.tiktokUrl ?? undefined),
    facebookUrl: normalizeArtistUrl(data.facebookUrl ?? undefined),
    releaseUrl: normalizeArtistUrl(data.releaseUrl ?? undefined),
  }
}

type SavePendingResult = { updated: boolean }

/**
 * One pending submission per artist — every save overwrites `pendingProfile`.
 * There is no queue of requests; resubmits update the same review.
 */
async function savePending(
  status: 'DRAFT' | 'PENDING',
  data: ArtistProfileFields,
): Promise<ActionResult<SavePendingResult>> {
  const session = await requireArtistSession()
  const artistId = session.user.artistId!

  if (!data.name?.trim() || !data.genre?.trim() || !data.location?.trim()) {
    return actionErr('Name, genre, and location are required.')
  }
  if (status === 'PENDING') {
    if (!data.profileImageUrl?.trim()) {
      return actionErr('Add a clear profile photo before submitting for review.')
    }
    if (!data.bio?.trim()) {
      return actionErr('Add a short bio before submitting for review.')
    }
    const hasMusic =
      (data.streamSource === 'YOUTUBE' && !!data.youtubeVideoId?.trim()) ||
      (data.streamSource === 'SPOTIFY' && !!data.spotifyTrackId?.trim()) ||
      (data.streamSource === 'SOUNDCLOUD' && !!data.soundcloudUrl?.trim()) ||
      (data.streamSource === 'CUSTOM' && !!data.customAudioUrl?.trim())
    if (!hasMusic) {
      return actionErr('Add a music link or upload before submitting for review.')
    }
  }

  const existing = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { reviewStatus: true, pendingProfile: true },
  })
  if (!existing) return actionErr('Artist not found.')

  const hadOpenReview =
    existing.reviewStatus === 'PENDING' ||
    existing.reviewStatus === 'CHANGES_REQUESTED' ||
    !!existing.pendingProfile

  // Never demote an open review back to draft — keep awaiting editor until approve/reject
  let nextStatus: 'DRAFT' | 'PENDING' | 'CHANGES_REQUESTED' = status
  if (status === 'DRAFT') {
    if (existing.reviewStatus === 'PENDING') nextStatus = 'PENDING'
    else if (existing.reviewStatus === 'CHANGES_REQUESTED') nextStatus = 'CHANGES_REQUESTED'
  }

  const profile = sanitizeProfile(data)

  try {
    await withDbRetry(() =>
      prisma.artist.update({
        where: { id: artistId },
        data: {
          pendingProfile: profile,
          reviewStatus: nextStatus,
          // Resubmit after feedback clears the note; mid-review edits keep the note until then
          ...(status === 'PENDING' ? { reviewNote: null } : {}),
        },
      }),
    )
    revalidatePath('/artist')
    revalidatePath('/admin/artists')
    revalidatePath(`/admin/artists/${artistId}/edit`)
    return actionOk({ updated: hadOpenReview })
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function saveArtistDraft(
  data: ArtistProfileFields,
): Promise<ActionResult<SavePendingResult>> {
  return savePending('DRAFT', data)
}

export async function submitArtistProfile(
  data: ArtistProfileFields,
): Promise<ActionResult<SavePendingResult>> {
  return savePending('PENDING', data)
}

export async function acceptArtistInvite(input: {
  token: string
  name: string
  password: string
}): Promise<ActionResult<string>> {
  const token = input.token?.trim()
  const name = input.name?.trim()
  const password = input.password

  if (!token) return actionErr('Invalid invite.')
  if (!name) return actionErr('Name is required.')
  if (!password || password.length < 8) {
    return actionErr('Password must be at least 8 characters.')
  }

  const invite = await prisma.artistInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: {
      artist: {
        select: {
          id: true,
          name: true,
          account: { select: { id: true } },
        },
      },
    },
  })

  if (!invite || invite.acceptedAt) return actionErr('This invite is invalid or already used.')
  if (invite.expiresAt.getTime() < Date.now()) return actionErr('This invite has expired.')
  if (invite.artist.account) return actionErr('This artist already has an account.')

  const existing = await prisma.user.findUnique({ where: { email: invite.email } })
  if (existing) return actionErr('An account with this email already exists.')

  const hash = await bcrypt.hash(password, 12)

  try {
    await withDbRetry(() =>
      prisma.$transaction([
        prisma.user.create({
          data: {
            email: invite.email,
            password: hash,
            name,
            role: 'ARTIST',
            artistId: invite.artistId,
          },
        }),
        prisma.artistInvite.update({
          where: { id: invite.id },
          data: { acceptedAt: new Date() },
        }),
      ]),
    )
    return actionOk(invite.email)
  } catch (err) {
    return actionErr(dbErrorMessage(err))
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

function releaseWriteData(data: ArtistReleasePayload) {
  return {
    title:       data.title.trim(),
    type:        data.type as ReleaseType,
    year:        data.year,
    label:       data.label?.trim() || null,
    description: data.description?.trim() || null,
    coverUrl:    data.coverUrl?.trim() || null,
    listenUrl:   normalizeArtistUrl(data.listenUrl),
    order:       data.order ?? 0,
  }
}

function trackWriteData(
  track: ArtistReleasePayload['tracks'][number],
  index: number,
) {
  return {
    number:          track.number || index + 1,
    title:           track.title.trim(),
    featuredArtists: track.featuredArtists?.trim() || null,
    duration:        track.duration?.trim() || null,
    explicit:        track.explicit ?? false,
    listenUrl:       normalizeArtistUrl(track.listenUrl),
  }
}

function revalidatePublicArtist(slug: string) {
  revalidatePath('/artists')
  revalidatePath(`/artists/${slug}`)
  revalidatePath('/artist')
}

export async function createMyRelease(
  artistId: string,
  data: ArtistReleasePayload,
): Promise<ActionResult> {
  const session = await requireArtistSession()
  if (session.user.artistId !== artistId) {
    return actionErr('You can only edit your own discography.')
  }

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
          ...releaseWriteData(data),
          tracks: { create: data.tracks.map(trackWriteData) },
        },
      }),
    )
    revalidatePublicArtist(artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateMyRelease(
  releaseId: string,
  data: ArtistReleasePayload,
): Promise<ActionResult> {
  const session = await requireArtistSession()
  const validationError = validateRelease(data)
  if (validationError) return actionErr(validationError)

  const existing = await prisma.artistRelease.findUnique({
    where: { id: releaseId },
    select: {
      coverUrl: true,
      artistId: true,
      artist: { select: { slug: true } },
    },
  })
  if (!existing) return actionErr('Release not found.')
  if (existing.artistId !== session.user.artistId) {
    return actionErr('You can only edit your own discography.')
  }

  try {
    await withDbRetry(() =>
      prisma.$transaction([
        prisma.releaseTrack.deleteMany({ where: { releaseId } }),
        prisma.artistRelease.update({
          where: { id: releaseId },
          data: {
            ...releaseWriteData(data),
            tracks: { create: data.tracks.map(trackWriteData) },
          },
        }),
      ]),
    )
    await deleteMediaIfReplaced(existing.coverUrl, data.coverUrl)
    revalidatePublicArtist(existing.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteMyRelease(releaseId: string): Promise<ActionResult> {
  const session = await requireArtistSession()
  const release = await prisma.artistRelease.findUnique({
    where: { id: releaseId },
    select: {
      coverUrl: true,
      artistId: true,
      artist: { select: { slug: true } },
    },
  })
  if (!release) return actionErr('Release not found.')
  if (release.artistId !== session.user.artistId) {
    return actionErr('You can only edit your own discography.')
  }

  try {
    await withDbRetry(() => prisma.artistRelease.delete({ where: { id: releaseId } }))
    await deleteMediaUrls([release.coverUrl])
    revalidatePublicArtist(release.artist.slug)
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export type { StreamSourceValue, ArtistProfileFields }
