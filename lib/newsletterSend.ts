// lib/newsletterSend.ts — batch send + per-recipient logs + resume support
import { prisma } from './prisma'
import { getEmailFrom, getResend, getSiteUrl } from './resend'
import {
  buildNewsletterHtml,
  buildUnsubscribeUrl,
  type EventDetails,
  type NewsletterArticle,
  type NewsletterTemplate,
} from './newsletterEmail'
import type { RecipientMode } from './newsletter'

const BATCH_SIZE = 50

export interface CampaignContentPayload {
  template?: NewsletterTemplate
  previewText?: string
  heroTitle: string
  heroSub?: string
  intro: string
  articles?: NewsletterArticle[]
  includeHighlights?: boolean
  event?: EventDetails
  signOff: string
  ctaText?: string
  ctaUrl?: string
  replyTo?: string
  senderName?: string
}

function personalize(text: string, name?: string | null): string {
  const first = name?.trim()?.split(/\s+/)[0] || 'there'
  return text.replace(/\[First Name\]/gi, first)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function processCampaignBatch(campaignId: string, maxBatches = 20) {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
  })
  if (!campaign || !['SENDING', 'SCHEDULED'].includes(campaign.status)) {
    return { done: true, sent: 0, failed: 0 }
  }

  if (campaign.status === 'SCHEDULED') {
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    })
  }

  const payload = campaign.contentPayload as CampaignContentPayload | null
  if (!payload?.heroTitle || !payload.intro || !payload.signOff) {
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED', errorMessage: 'Missing campaign content payload' },
    })
    return { done: true, sent: 0, failed: 0, error: 'Invalid payload' }
  }

  const siteUrl = getSiteUrl()
  const from = getEmailFrom(payload.senderName)
  const resend = getResend()

  let batchesRun = 0
  let batchSent = 0
  let batchFailed = 0

  while (batchesRun < maxBatches) {
    const pending = await prisma.newsletterSendLog.findMany({
      where: { campaignId, status: 'pending' },
      take: BATCH_SIZE,
      include: {
        subscriber: { select: { id: true, email: true, name: true, unsubToken: true } },
      },
    })

    if (!pending.length) break

    const emails = pending.map(log => {
      const sub = log.subscriber
      const unsub = buildUnsubscribeUrl(siteUrl, sub.unsubToken, true)
      const html = buildNewsletterHtml({
        subject: campaign.subject,
        template: payload.template || 'frequency',
        previewText: payload.previewText,
        heroTitle: payload.heroTitle,
        heroSub: payload.heroSub,
        intro: personalize(payload.intro, sub.name),
        articles: payload.articles ?? [],
        includeHighlights: payload.includeHighlights !== false,
        event: payload.event,
        signOff: personalize(payload.signOff, sub.name),
        ctaText: payload.ctaText,
        ctaUrl: payload.ctaUrl || siteUrl,
        unsubscribeUrl: unsub,
        siteUrl,
      })

      return {
        logId: log.id,
        email: {
          from,
          to: [sub.email],
          subject: campaign.subject,
          html,
          replyTo: payload.replyTo || undefined,
          headers: { 'List-Unsubscribe': `<${unsub}>` },
        },
      }
    })

    const { data, error } = await resend.batch.send(emails.map(e => e.email))

    if (error) {
      await prisma.newsletterSendLog.updateMany({
        where: { id: { in: pending.map(p => p.id) } },
        data: { status: 'failed', errorMessage: error.message, sentAt: new Date() },
      })
      batchFailed += pending.length
    } else {
      const resultCount =
        Array.isArray((data as { data?: unknown[] } | null)?.data)
          ? (data as { data: unknown[] }).data.length
          : pending.length

      const successIds = emails.slice(0, resultCount).map(e => e.logId)
      const failIds = emails.slice(resultCount).map(e => e.logId)

      if (successIds.length) {
        await prisma.newsletterSendLog.updateMany({
          where: { id: { in: successIds } },
          data: { status: 'sent', sentAt: new Date() },
        })
        batchSent += successIds.length
      }
      if (failIds.length) {
        await prisma.newsletterSendLog.updateMany({
          where: { id: { in: failIds } },
          data: { status: 'failed', errorMessage: 'Batch partial failure', sentAt: new Date() },
        })
        batchFailed += failIds.length
      }
      if (!successIds.length && !failIds.length) {
        await prisma.newsletterSendLog.updateMany({
          where: { id: { in: pending.map(p => p.id) } },
          data: { status: 'sent', sentAt: new Date() },
        })
        batchSent += pending.length
      }
    }

    batchesRun++
    await sleep(400)
  }

  const [sentCount, failedCount, pendingCount] = await Promise.all([
    prisma.newsletterSendLog.count({ where: { campaignId, status: 'sent' } }),
    prisma.newsletterSendLog.count({ where: { campaignId, status: 'failed' } }),
    prisma.newsletterSendLog.count({ where: { campaignId, status: 'pending' } }),
  ])

  const done = pendingCount === 0
  if (done) {
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: {
        status: sentCount === 0 ? 'FAILED' : 'SENT',
        sentCount,
        failedCount,
        sentAt: new Date(),
        errorMessage: failedCount > 0 ? `${failedCount} recipient(s) failed` : null,
      },
    })
  } else {
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { sentCount, failedCount, status: 'SENDING' },
    })
  }

  return { done, sent: batchSent, failed: batchFailed, pending: pendingCount }
}

export async function createAndQueueCampaign(input: {
  subject: string
  previewText?: string
  html: string
  payload: CampaignContentPayload
  recipientMode: RecipientMode
  recipientFilter?: { ids?: string[]; tagIds?: string[] }
  subscriberIds: string[]
  scheduledFor?: Date | null
}) {
  const status = input.scheduledFor ? 'SCHEDULED' : 'SENDING'

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      subject: input.subject,
      previewText: input.previewText || null,
      html: input.html,
      contentPayload: input.payload as object,
      status,
      recipientMode: input.recipientMode,
      recipientFilter: (input.recipientFilter ?? {}) as object,
      recipientCount: input.subscriberIds.length,
      scheduledFor: input.scheduledFor ?? null,
      sendLogs: {
        create: input.subscriberIds.map(subscriberId => ({
          subscriberId,
          status: 'pending',
        })),
      },
    },
  })

  if (!input.scheduledFor) {
    await processCampaignBatch(campaign.id, 10)
  }

  const updated = await prisma.newsletterCampaign.findUnique({ where: { id: campaign.id } })
  return updated!
}
