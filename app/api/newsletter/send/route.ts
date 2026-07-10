// app/api/newsletter/send/route.ts
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import {
  buildNewsletterHtml,
  buildUnsubscribeUrl,
  type NewsletterArticle,
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
    heroTitle,
    heroSub,
    intro,
    articles,
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
    heroTitle?: string
    heroSub?: string
    intro?: string
    articles?: NewsletterArticle[]
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

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }
  if (!heroTitle?.trim() || !intro?.trim() || !signOff?.trim()) {
    return NextResponse.json(
      { error: 'Hero title, intro, and sign-off are required' },
      { status: 400 },
    )
  }

  const siteUrl = getSiteUrl()
  const from = getEmailFrom(senderName)
  const resend = getResend()

  if (testEmail?.trim()) {
    const to = testEmail.trim().toLowerCase()
    const html = buildNewsletterHtml({
      subject: subject.trim(),
      previewText: previewText?.trim(),
      heroTitle: heroTitle.trim(),
      heroSub: heroSub?.trim(),
      intro: personalize(intro.trim(), 'Tester'),
      articles: Array.isArray(articles) ? articles : [],
      signOff: personalize(signOff.trim(), 'Tester'),
      ctaText: ctaText?.trim(),
      ctaUrl: ctaUrl?.trim() || siteUrl,
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

  const payload: CampaignContentPayload = {
    previewText: previewText?.trim(),
    heroTitle: heroTitle.trim(),
    heroSub: heroSub?.trim(),
    intro: intro.trim(),
    articles: Array.isArray(articles) ? articles : [],
    signOff: signOff.trim(),
    ctaText: ctaText?.trim(),
    ctaUrl: ctaUrl?.trim() || siteUrl,
    replyTo: replyTo?.trim(),
    senderName,
  }

  const templateHtml = buildNewsletterHtml({
    subject: subject.trim(),
    ...payload,
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
    payload,
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
