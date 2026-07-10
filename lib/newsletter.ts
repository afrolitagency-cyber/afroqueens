// lib/newsletter.ts — subscriber eligibility, recipient resolution, sources
import { prisma } from './prisma'

export type RecipientMode = 'all' | 'selected' | 'tag'

export const NEWSLETTER_SOURCES = {
  footer: 'footer',
  blog: 'blog',
  csv_import: 'csv_import',
  inbox: 'inbox',
  manual: 'manual',
} as const

export type NewsletterSource = keyof typeof NEWSLETTER_SOURCES

/** Sources that are confirmed immediately (no double opt-in email). */
export const AUTO_CONFIRM_SOURCES: NewsletterSource[] = ['footer', 'blog', 'manual']

export function sourceRequiresConfirm(source: string): boolean {
  return !AUTO_CONFIRM_SOURCES.includes(source as NewsletterSource)
}

/** Active + confirmed subscribers eligible for bulk send. */
export function eligibleSubscriberWhere(extra?: object) {
  return {
    active: true,
    confirmedAt: { not: null },
    ...extra,
  }
}

export async function resolveRecipients(
  mode: RecipientMode,
  filter?: { ids?: string[]; tagIds?: string[] },
) {
  if (mode === 'selected') {
    const ids = filter?.ids?.filter(Boolean) ?? []
    if (!ids.length) return []
    return prisma.newsletterSubscriber.findMany({
      where: eligibleSubscriberWhere({ id: { in: ids } }),
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, unsubToken: true },
    })
  }

  if (mode === 'tag') {
    const tagIds = filter?.tagIds?.filter(Boolean) ?? []
    if (!tagIds.length) return []
    return prisma.newsletterSubscriber.findMany({
      where: eligibleSubscriberWhere({
        tags: { some: { id: { in: tagIds } } },
      }),
      orderBy: { createdAt: 'asc' },
      select: { id: true, email: true, name: true, unsubToken: true },
    })
  }

  return prisma.newsletterSubscriber.findMany({
    where: eligibleSubscriberWhere(),
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, unsubToken: true },
  })
}

export async function countEligibleRecipients(
  mode: RecipientMode,
  filter?: { ids?: string[]; tagIds?: string[] },
) {
  const list = await resolveRecipients(mode, filter)
  return list.length
}

export async function upsertSubscriber(input: {
  email: string
  name?: string | null
  source: NewsletterSource
  tagNames?: string[]
  confirmNow?: boolean
}) {
  const email = input.email.trim().toLowerCase()
  const needsConfirm = input.confirmNow === false || sourceRequiresConfirm(input.source)
  const confirmedAt = needsConfirm ? null : new Date()

  const tagConnect = input.tagNames?.length
    ? {
        connectOrCreate: input.tagNames.map(name => ({
          where: { name: name.trim().toLowerCase() },
          create: { name: name.trim().toLowerCase() },
        })),
      }
    : undefined

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

  if (existing) {
    return prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        name: input.name?.trim() || existing.name,
        source: input.source,
        active: true,
        confirmedAt: existing.confirmedAt ?? confirmedAt,
        ...(tagConnect ? { tags: tagConnect } : {}),
      },
    })
  }

  return prisma.newsletterSubscriber.create({
    data: {
      email,
      name: input.name?.trim() || null,
      source: input.source,
      active: true,
      confirmedAt,
      ...(tagConnect ? { tags: tagConnect } : {}),
    },
  })
}
