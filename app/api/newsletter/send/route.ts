// app/api/newsletter/send/route.ts
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import {
  buildNewsletterHtml,
  buildUnsubscribeUrl,
  type EventDetails,
  type NewsletterArticle,
  type NewsletterTemplate,
} from '@/lib/newsletterEmail'
import { getEmailFrom, getResend, getSiteUrl } from '@/lib/resend'
import { countEligibleRecipients, resolveRecipients, type RecipientMode } from '@/lib/newsletter'
import { createAndQueueCampaign, type CampaignContentPayload } from '@/lib/newsletterSend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function personalize(text: string, name?: string | null): string {
  const first = name?.trim()?.split(/\s+/)[0] || 'there'
  return text.replace(/\[First Name\]/gi, first)
}

function normalizeTemplate(value?: string): NewsletterTemplate {
  if (value === 'event' || value === 'plain') return value
  return 'frequency'
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is missing. Add it to your environment and restart the server.' },
      { status: 500 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const {
    subject,
    previewText,
    template: rawTemplate,
    heroTitle,
    heroSub,
    intro,
    articles,
    includeHighlights = true,
    event,
    signOff,
    ctaText,
    ctaUrl,
    replyTo,
    senderName,
    schedule,
    scheduledFor,
    testEmail,
    audience = 'all',
    recipientIds,
    tagIds,
  } = body as {
    subject?: string
    previewText?: string
    template?: string
    heroTitle?: string
    heroSub?: string
    intro?: string
    articles?: NewsletterArticle[]
    includeHighlights?: boolean
    event?: EventDetails
    signOff?: string
    ctaText?: string
    ctaUrl?: string
    replyTo?: string
    senderName?: string
    schedule?: 'now' | 'later'
    scheduledFor?: string
    testEmail?: string
    audience?: RecipientMode
    recipientIds?: string[]
    tagIds?: string[]
  }

  const template = normalizeTemplate(rawTemplate)

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }
  if (!heroTitle?.trim() || !intro?.trim() || !signOff?.trim()) {
    return NextResponse.json(
      { error: 'Title, message, and sign-off are required' },
      { status: 400 },
    )
  }
  if (template === 'event' && !event?.eventName?.trim()) {
    return NextResponse.json({ error: 'Event name is required for the event template' }, { status: 400 })
  }
  if (template === 'event' && !event?.eventDate?.trim()) {
    return NextResponse.json({ error: 'Event date is required for the event template' }, { status: 400 })
  }

  const siteUrl = getSiteUrl()
  const from = getEmailFrom(senderName)
  const resend = getResend()

  const contentPayload: CampaignContentPayload = {
    template,
    previewText: previewText?.trim(),
    heroTitle: heroTitle.trim(),
    heroSub: heroSub?.trim(),
    intro: intro.trim(),
    articles: template === 'frequency' && includeHighlights && Array.isArray(articles) ? articles : [],
    includeHighlights: template === 'frequency' ? includeHighlights !== false : false,
    event:
      template === 'event'
        ? {
            eventName: event!.eventName.trim(),
            eventDate: event!.eventDate.trim(),
            eventTime: event?.eventTime?.trim() || undefined,
            eventLocation: event?.eventLocation?.trim() || undefined,
            eventNotes: event?.eventNotes?.trim() || undefined,
          }
        : undefined,
    signOff: signOff.trim(),
    ctaText: ctaText?.trim(),
    ctaUrl: ctaUrl?.trim() || siteUrl,
    replyTo: replyTo?.trim(),
    senderName,
  }

  if (testEmail?.trim()) {
    const to = testEmail.trim().toLowerCase()
    const html = buildNewsletterHtml({
      subject: subject.trim(),
      ...contentPayload,
      intro: personalize(contentPayload.intro, 'Tester'),
      signOff: personalize(contentPayload.signOff, 'Tester'),
      unsubscribeUrl: buildUnsubscribeUrl(siteUrl, to, false),
      siteUrl,
    })

    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject: `[TEST] ${subject.trim()}`,
      html,
      replyTo: replyTo?.trim() || undefined,
    })

    if (error) {
      return NextResponse.json({ error: error.message, sent: false }, { status: 502 })
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      test: true,
      message: `Test email sent to ${to}.`,
    })
  }

  const mode: RecipientMode =
    audience === 'selected' || audience === 'tag' ? audience : 'all'

  const filter =
    mode === 'selected'
      ? { ids: recipientIds ?? [] }
      : mode === 'tag'
        ? { tagIds: tagIds ?? [] }
        : undefined

  const subscribers = await resolveRecipients(mode, filter)

  if (!subscribers.length) {
    return NextResponse.json(
      { error: 'No eligible subscribers match this audience (must be active and confirmed).' },
      { status: 400 },
    )
  }

  const templateHtml = buildNewsletterHtml({
    subject: subject.trim(),
    ...contentPayload,
    unsubscribeUrl: `${siteUrl}/api/newsletter/unsubscribe`,
    siteUrl,
  })

  const scheduleDate =
    schedule === 'later' && scheduledFor ? new Date(scheduledFor) : null

  if (scheduleDate && Number.isNaN(scheduleDate.getTime())) {
    return NextResponse.json({ error: 'Invalid schedule date' }, { status: 400 })
  }

  const campaign = await createAndQueueCampaign({
    subject: subject.trim(),
    previewText: previewText?.trim(),
    html: templateHtml,
    payload: contentPayload,
    recipientMode: mode,
    recipientFilter: filter,
    subscriberIds: subscribers.map(s => s.id),
    scheduledFor: scheduleDate,
  })

  if (campaign.status === 'SCHEDULED') {
    return NextResponse.json({
      ok: true,
      sent: false,
      scheduled: true,
      campaignId: campaign.id,
      recipientCount: subscribers.length,
      message: `Campaign scheduled for ${scheduleDate!.toLocaleString('en-GB')}.`,
    })
  }

  return NextResponse.json({
    ok: true,
    sent: true,
    campaignId: campaign.id,
    recipientCount: campaign.recipientCount,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    message:
      campaign.failedCount === 0
        ? `Newsletter sent to ${campaign.sentCount} subscriber${campaign.sentCount === 1 ? '' : 's'}.`
        : `Sent to ${campaign.sentCount}, failed for ${campaign.failedCount}.`,
  })
}

/** Preview recipient count without sending */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const audience = (searchParams.get('audience') || 'all') as RecipientMode
  const ids = searchParams.get('ids')?.split(',').filter(Boolean)
  const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean)

  const count = await countEligibleRecipients(
    audience,
    audience === 'selected' ? { ids } : audience === 'tag' ? { tagIds } : undefined,
  )

  return NextResponse.json({ count, audience })
}
