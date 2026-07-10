'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withDbRetry } from '@/lib/dbRetry'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
}

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
  location?: string
  startsAt: string
  endsAt?: string
  published?: boolean
  tagName?: string
  confirmEmailSubject?: string
  confirmEmailBody?: string
}

export async function createEvent(data: EventPayload) {
  await requireAdmin()
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

  const event = await withDbRetry(() =>
    prisma.event.create({
      data: {
        title,
        slug,
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        startsAt,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        published: data.published !== false,
        confirmEmailSubject: data.confirmEmailSubject?.trim() || null,
        confirmEmailBody: data.confirmEmailBody?.trim() || null,
        tagId: tag.id,
      },
    }),
  )

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${slug}`)
  return event
}

export async function updateEvent(id: string, data: EventPayload) {
  await requireAdmin()
  const title = data.title.trim()
  if (!title) throw new Error('Title is required')
  const startsAt = new Date(data.startsAt)
  if (Number.isNaN(startsAt.getTime())) throw new Error('Invalid start date')

  const current = await prisma.event.findUnique({ where: { id }, include: { tag: true } })
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

  const event = await withDbRetry(() =>
    prisma.event.update({
      where: { id },
      data: {
        title,
        slug,
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        startsAt,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        published: data.published !== false,
        confirmEmailSubject: data.confirmEmailSubject?.trim() || null,
        confirmEmailBody: data.confirmEmailBody?.trim() || null,
        tagId: tag.id,
      },
    }),
  )

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath(`/events/${slug}`)
  return event
}

export async function deleteEvent(id: string) {
  await requireAdmin()
  const event = await prisma.event.delete({ where: { id } })
  revalidatePath('/admin/events')
  revalidatePath('/events')
  return event
}
