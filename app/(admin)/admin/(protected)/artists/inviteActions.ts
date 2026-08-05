'use server'
// app/(admin)/admin/(protected)/artists/inviteActions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import slugify from 'slugify'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import { actionOk, actionErr, type ActionResult } from '@/lib/actions'
import {
  createInviteToken,
  inviteAcceptUrl,
  inviteExpiresAt,
  sendArtistInviteEmail,
  sendArtistChangesRequestedEmail,
} from '@/lib/artistInvite'
import { normalizeArtistUrl } from '@/lib/artistLinks'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'
import { pickLiveProfile, type ArtistProfileFields } from '@/lib/artistProfile'
import { Prisma } from '@prisma/client'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
  if (session.user.role === 'ARTIST') redirect('/artist')
  return session
}

export type InviteArtistResult =
  | { ok: true; inviteUrl: string; emailSent: boolean; emailError?: string; artistId?: string }
  | { ok: false; error: string }

export async function inviteArtist(
  artistId: string,
  email: string,
): Promise<InviteArtistResult> {
  await requireAdmin()

  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !trimmed.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      name: true,
      account: { select: { id: true, email: true } },
    },
  })
  if (!artist) return { ok: false, error: 'Artist not found.' }
  if (artist.account) {
    return {
      ok: false,
      error: `This artist already has an account (${artist.account.email}).`,
    }
  }

  return createInviteForArtist(artist.id, artist.name, trimmed)
}

/** Resend email for the latest unused invite for this artist + email. */
export async function resendArtistInvite(
  artistId: string,
  email?: string,
): Promise<InviteArtistResult> {
  await requireAdmin()

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      id: true,
      name: true,
      account: { select: { id: true } },
    },
  })
  if (!artist) return { ok: false, error: 'Artist not found.' }
  if (artist.account) {
    return { ok: false, error: 'This artist already has a portal account.' }
  }

  const trimmed = email?.trim().toLowerCase()
  const invite = await prisma.artistInvite.findFirst({
    where: {
      artistId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      ...(trimmed ? { email: trimmed } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!invite) {
    return {
      ok: false,
      error: 'No open invite found. Send a new invite first.',
    }
  }

  // Refresh expiry and optionally rotate nothing — keep same token so old links still work
  await withDbRetry(() =>
    prisma.artistInvite.update({
      where: { id: invite.id },
      data: { expiresAt: inviteExpiresAt(7) },
    }),
  )

  const inviteUrl = inviteAcceptUrl(invite.token)
  const sent = await sendArtistInviteEmail({
    to: invite.email,
    artistName: artist.name,
    token: invite.token,
  })

  return {
    ok: true,
    inviteUrl,
    emailSent: sent.ok,
    emailError: sent.ok ? undefined : sent.error,
    artistId,
  }
}

/** Create a new artist profile and send a portal invite in one step. */
export async function createAndInviteArtist(input: {
  name: string
  email: string
  genre?: string
  location?: string
}): Promise<InviteArtistResult> {
  await requireAdmin()

  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const genre = input.genre?.trim() || 'Afrobeats'
  const location = input.location?.trim() || 'TBA'

  if (!name) return { ok: false, error: 'Artist name is required.' }
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Enter a valid email address.' }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, artistId: true },
  })
  if (existingUser) {
    return { ok: false, error: 'That email already belongs to another account.' }
  }

  // Reuse an open invite for this email instead of creating another profile
  const openInvite = await prisma.artistInvite.findFirst({
    where: {
      email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      artist: { account: null },
    },
    orderBy: { createdAt: 'desc' },
    include: { artist: { select: { id: true, name: true } } },
  })
  if (openInvite) {
    return resendArtistInvite(openInvite.artistId, email)
  }

  // Reuse same-name profile that has no portal account yet
  const existingArtist = await prisma.artist.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      account: null,
    },
    select: { id: true, name: true },
  })
  if (existingArtist) {
    return createInviteForArtist(existingArtist.id, existingArtist.name, email)
  }

  const slugBase = slugify(name, { lower: true, strict: true }) || 'artist'
  let slug = slugBase
  let n = 2
  while (await prisma.artist.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${slugBase}-${n++}`
  }

  try {
    const artist = await withDbRetry(() =>
      prisma.artist.create({
        data: {
          name,
          slug,
          genre,
          location,
        },
        select: { id: true, name: true },
      }),
    )

    const invite = await createInviteForArtist(artist.id, artist.name, email)
    revalidatePath('/artists')
    revalidatePath(`/artists/${slug}`)
    revalidatePath('/')
    if (!invite.ok) return invite
    return { ...invite, artistId: artist.id }
  } catch (err) {
    return { ok: false, error: dbErrorMessage(err) }
  }
}

async function createInviteForArtist(
  artistId: string,
  artistName: string,
  email: string,
): Promise<InviteArtistResult> {
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { ok: false, error: 'That email already belongs to another account.' }
  }

  const token = createInviteToken()
  try {
    await withDbRetry(() =>
      prisma.artistInvite.create({
        data: {
          artistId,
          email,
          token,
          expiresAt: inviteExpiresAt(7),
        },
      }),
    )
  } catch (err) {
    return { ok: false, error: dbErrorMessage(err) }
  }

  const inviteUrl = inviteAcceptUrl(token)
  const sent = await sendArtistInviteEmail({
    to: email,
    artistName,
    token,
  })

  revalidatePath('/admin/artists')
  revalidatePath(`/admin/artists/${artistId}/edit`)
  revalidatePath('/admin/artists/invite')

  return {
    ok: true,
    inviteUrl,
    emailSent: sent.ok,
    emailError: sent.ok ? undefined : sent.error,
    artistId,
  }
}

export async function approveArtistProfile(artistId: string): Promise<ActionResult> {
  await requireAdmin()

  const artist = await prisma.artist.findUnique({ where: { id: artistId } })
  if (!artist) return actionErr('Artist not found.')
  if (!artist.pendingProfile || artist.reviewStatus !== 'PENDING') {
    return actionErr('No pending profile submission to approve.')
  }

  const pending = artist.pendingProfile as Partial<ArtistProfileFields>
  const merged: ArtistProfileFields = {
    ...pickLiveProfile(artist),
    ...pending,
  }

  try {
    await withDbRetry(() =>
      prisma.artist.update({
        where: { id: artistId },
        data: {
          name:             merged.name,
          genre:            merged.genre,
          location:         merged.location,
          monthlyListeners: merged.monthlyListeners,
          bio:              merged.bio,
          profileImageUrl:  merged.profileImageUrl,
          streamSource:     merged.streamSource,
          spotifyTrackId:   extractSpotifyTrackId(merged.spotifyTrackId ?? undefined),
          youtubeVideoId:   extractYoutubeVideoId(merged.youtubeVideoId ?? undefined),
          soundcloudUrl:    merged.soundcloudUrl?.trim() || null,
          customAudioUrl:   merged.customAudioUrl?.trim() || null,
          instagramUrl:     normalizeArtistUrl(merged.instagramUrl ?? undefined),
          twitterUrl:       normalizeArtistUrl(merged.twitterUrl ?? undefined),
          tiktokUrl:        normalizeArtistUrl(merged.tiktokUrl ?? undefined),
          facebookUrl:      normalizeArtistUrl(merged.facebookUrl ?? undefined),
          releaseUrl:       normalizeArtistUrl(merged.releaseUrl ?? undefined),
          pendingProfile:   Prisma.DbNull,
          reviewStatus:     'NONE',
          reviewNote:       null,
        },
      }),
    )

    revalidatePath('/artists')
    revalidatePath(`/artists/${artist.slug}`)
    revalidatePath('/')
    revalidatePath('/admin/artists')
    revalidatePath(`/admin/artists/${artistId}/edit`)
    revalidatePath('/artist')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function rejectArtistProfile(
  artistId: string,
  note?: string,
): Promise<ActionResult> {
  await requireAdmin()

  try {
    await withDbRetry(() =>
      prisma.artist.update({
        where: { id: artistId },
        data: {
          pendingProfile: Prisma.DbNull,
          reviewStatus: 'NONE',
          reviewNote: note?.trim() || null,
        },
      }),
    )
    revalidatePath('/admin/artists')
    revalidatePath(`/admin/artists/${artistId}/edit`)
    revalidatePath('/artist')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

/** Keep pending edits, email the artist, and show feedback in their portal. */
export async function requestArtistChanges(
  artistId: string,
  note: string,
): Promise<ActionResult<{ emailSent: boolean; emailError?: string }>> {
  await requireAdmin()

  const trimmed = note.trim()
  if (!trimmed) return actionErr('Write a short note for the artist (what to fix).')

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: {
      name: true,
      pendingProfile: true,
      reviewStatus: true,
      account: { select: { email: true } },
    },
  })
  if (!artist?.pendingProfile || (artist.reviewStatus !== 'PENDING' && artist.reviewStatus !== 'CHANGES_REQUESTED')) {
    return actionErr('No pending submission to send back.')
  }
  if (!artist.account?.email) {
    return actionErr('This artist has no linked email account to notify.')
  }

  try {
    await withDbRetry(() =>
      prisma.artist.update({
        where: { id: artistId },
        data: {
          reviewStatus: 'CHANGES_REQUESTED',
          reviewNote: trimmed,
        },
      }),
    )

    const emailed = await sendArtistChangesRequestedEmail({
      to: artist.account.email,
      artistName: artist.name,
      note: trimmed,
    })

    revalidatePath('/admin/artists')
    revalidatePath(`/admin/artists/${artistId}/edit`)
    revalidatePath('/artist')

    if (!emailed.ok) {
      return actionOk({
        emailSent: false,
        emailError: emailed.error,
      })
    }
    return actionOk({ emailSent: true })
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
