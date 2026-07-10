'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { upsertSubscriber, type NewsletterSource } from '@/lib/newsletter'
import { sendSubscriptionConfirmEmail } from '@/lib/newsletterConfirm'
import { withDbRetry } from '@/lib/dbRetry'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function removeSubscriber(id: string) {
  await requireAdmin()
  return withDbRetry(() => prisma.newsletterSubscriber.delete({ where: { id } }))
}

export async function toggleSubscriberActive(id: string, active: boolean) {
  await requireAdmin()
  return withDbRetry(() =>
    prisma.newsletterSubscriber.update({ where: { id }, data: { active } }),
  )
}

export async function addSubscriberManual(email: string, name?: string, tagNames?: string[]) {
  await requireAdmin()
  const sub = await withDbRetry(() =>
    upsertSubscriber({
      email,
      name,
      source: 'manual',
      tagNames,
      confirmNow: true,
    }),
  )
  return sub
}

export async function addSubscriberFromInbox(email: string, name: string) {
  await requireAdmin()
  const sub = await withDbRetry(() =>
    upsertSubscriber({
      email,
      name,
      source: 'inbox',
      confirmNow: false,
    }),
  )
  if (!sub.confirmedAt) {
    try {
      await sendSubscriptionConfirmEmail(sub.email, sub.unsubToken)
    } catch (e) {
      console.error('[newsletter] confirm email failed:', e)
    }
  }
  return sub
}

export async function importSubscribersCsv(
  rows: { email: string; name?: string; tags?: string }[],
  options?: { confirmNow?: boolean },
) {
  await requireAdmin()
  let imported = 0
  let skipped = 0
  const confirmNow = options?.confirmNow === true

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      skipped++
      continue
    }
    const tagNames = row.tags
      ? row.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean)
      : undefined

    const sub = await upsertSubscriber({
      email,
      name: row.name,
      source: 'csv_import',
      tagNames,
      confirmNow,
    })

    if (!confirmNow && !sub.confirmedAt && sub.unsubToken) {
      try {
        await sendSubscriptionConfirmEmail(sub.email, sub.unsubToken)
      } catch {
        /* continue import */
      }
    }
    imported++
  }

  return { imported, skipped, confirmNow }
}

export async function createTag(name: string) {
  await requireAdmin()
  const slug = name.trim().toLowerCase()
  if (!slug) throw new Error('Tag name required')
  return prisma.newsletterTag.upsert({
    where: { name: slug },
    create: { name: slug },
    update: {},
  })
}

export async function deleteTag(id: string) {
  await requireAdmin()
  await prisma.newsletterTag.delete({ where: { id } })
}

export async function setSubscriberTags(subscriberId: string, tagIds: string[]) {
  await requireAdmin()
  await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: {
      tags: { set: tagIds.map(id => ({ id })) },
    },
  })
}

export async function updateSubscriber(
  id: string,
  data: { name?: string | null; tagIds?: string[] },
) {
  await requireAdmin()
  return withDbRetry(() =>
    prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name?.trim() || null } : {}),
        ...(data.tagIds !== undefined
          ? { tags: { set: data.tagIds.map(tid => ({ id: tid })) } }
          : {}),
      },
      include: { tags: { select: { id: true, name: true } } },
    }),
  )
}

export async function bulkSetSubscriberTags(subscriberIds: string[], tagIds: string[]) {
  await requireAdmin()
  for (const id of subscriberIds) {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { tags: { set: tagIds.map(tid => ({ id: tid })) } },
    })
  }
}

/** Add tags to subscribers without removing existing ones. */
export async function connectTagsToSubscribers(subscriberIds: string[], tagIds: string[]) {
  await requireAdmin()
  if (!subscriberIds.length || !tagIds.length) return
  for (const id of subscriberIds) {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { tags: { connect: tagIds.map(tid => ({ id: tid })) } },
    })
  }
}
