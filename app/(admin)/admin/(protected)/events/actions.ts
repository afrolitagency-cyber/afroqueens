'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/authz'
import { prisma } from '@/lib/prisma'
import { withDbRetry } from '@/lib/dbRetry'
import { deleteMediaIfReplaced, deleteMediaUrls } from '@/lib/media'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

type EventPayload = {
  title: string
  slug?: string
  description?: string
  coverImageUrl?: string
  location?: string
  startsAt: string
  endsAt?: string
  published?: boolean
  registrationRequired?: boolean
  tagName?: string
  confirmEmailSubject?: string
  confirmEmailBody?: string
  artistIds?: string[]
}

async function uniqueArtistIds(ids?: string[]) {
  const unique = Array.from(new Set((ids ?? []).map(id => id.trim()).filter(Boolean)))
  if (unique.length === 0) return []
  const artists = await prisma.artist.findMany({
    where: { id: { in: unique } },
    select: { id: true, slug: true },
  })
  return artists
}

async function revalidateEventSurfaces(slug: string, extraSlugs: string[] = []) {
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${slug}`)
  for (const artistSlug of extraSlugs) {
    revalidatePath(`/artists/${artistSlug}`)
  }
}

export async function createEvent(data: EventPayload) {
  await requireStaff({ fresh: data.published !== false })
  const title = data.title.trim()
  if (!title) throw new Error('Title is required')
  const startsAt = new Date(data.startsAt)
  if (Number.isNaN(startsAt.getTime())) throw new Error('Invalid start date')

  let slug = (data.slug?.trim() || slugify(title)) || `event-${Date.now()}`
  const existing = await prisma.event.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const tagName = (data.tagName?.trim() || slug).toLowerCase()
  const tag = await prisma.newsletterTag.upsert({
    where: { name: tagName },
    create: { name: tagName },
    update: {},
  })

  const artists = await uniqueArtistIds(data.artistIds)

  const event = await withDbRetry(() =>
    prisma.event.create({
      data: {
        title,
        slug,
        description: data.description?.trim() || null,
        coverImageUrl: data.coverImageUrl?.trim() || null,
        location: data.location?.trim() || null,
        startsAt,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        published: data.published !== false,
        registrationRequired: data.registrationRequired !== false,
        confirmEmailSubject: data.confirmEmailSubject?.trim() || null,
        confirmEmailBody: data.confirmEmailBody?.trim() || null,
        tagId: tag.id,
        artists: { connect: artists.map(a => ({ id: a.id })) },
      },
    }),
  )

  await revalidateEventSurfaces(slug, artists.map(a => a.slug))
  return event
}

export async function updateEvent(id: string, data: EventPayload) {
  await requireStaff({ fresh: data.published !== false })
  const title = data.title.trim()
  if (!title) throw new Error('Title is required')
  const startsAt = new Date(data.startsAt)
  if (Number.isNaN(startsAt.getTime())) throw new Error('Invalid start date')

  const current = await prisma.event.findUnique({
    where: { id },
    include: { tag: true, artists: { select: { id: true, slug: true } } },
  })
  if (!current) throw new Error('Event not found')

  let slug = (data.slug?.trim() || slugify(title)) || current.slug
  if (slug !== current.slug) {
    const clash = await prisma.event.findUnique({ where: { slug } })
    if (clash) throw new Error('Slug already in use')
  }

  const tagName = (data.tagName?.trim() || current.tag?.name || slug).toLowerCase()
  const tag = await prisma.newsletterTag.upsert({
    where: { name: tagName },
    create: { name: tagName },
    update: {},
  })

  const artists = await uniqueArtistIds(data.artistIds)
  const artistSlugs = Array.from(
    new Set([...current.artists.map(a => a.slug), ...artists.map(a => a.slug)]),
  )

  const event = await withDbRetry(() =>
    prisma.event.update({
      where: { id },
      data: {
        title,
        slug,
        description: data.description?.trim() || null,
        coverImageUrl: data.coverImageUrl?.trim() || null,
        location: data.location?.trim() || null,
        startsAt,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        published: data.published !== false,
        registrationRequired: data.registrationRequired !== false,
        confirmEmailSubject: data.confirmEmailSubject?.trim() || null,
        confirmEmailBody: data.confirmEmailBody?.trim() || null,
        tagId: tag.id,
        artists: { set: artists.map(a => ({ id: a.id })) },
      },
    }),
  )
  await deleteMediaIfReplaced(current.coverImageUrl, data.coverImageUrl)

  await revalidateEventSurfaces(slug, artistSlugs)
  if (current.slug !== slug) revalidatePath(`/events/${current.slug}`)
  return event
}

export async function deleteEvent(id: string) {
  await requireStaff()
  const event = await prisma.event.findUnique({
    where: { id },
    include: { artists: { select: { slug: true } } },
  })
  if (!event) throw new Error('Event not found')

  await prisma.event.delete({ where: { id } })
  await deleteMediaUrls([event.coverImageUrl])
  await revalidateEventSurfaces(event.slug, event.artists.map(a => a.slug))
  return event
}
