// lib/newsletterConfirm.ts
import { getEmailFrom, getResend, getSiteUrl } from './resend'
import {
  buildConfirmEmailHtml,
  buildEventRegistrationEmailHtml,
  buildUnsubscribeUrl,
} from './newsletterEmail'

export async function sendSubscriptionConfirmEmail(email: string, unsubToken: string) {
  const resend = getResend()
  const siteUrl = getSiteUrl()
  const html = buildConfirmEmailHtml(siteUrl, unsubToken)

  const { error } = await resend.emails.send({
    from: getEmailFrom('Afroqueens FM'),
    to: [email],
    subject: 'Confirm your Afroqueens newsletter subscription',
    html,
  })

  if (error) throw new Error(error.message)
}

export async function sendEventRegistrationEmail(input: {
  email: string
  name?: string | null
  unsubToken: string
  eventTitle: string
  eventSlug: string
  startsAt: Date
  location?: string | null
  confirmEmailSubject?: string | null
  confirmEmailBody?: string | null
}) {
  const resend = getResend()
  const siteUrl = getSiteUrl()
  const firstName = input.name?.trim()?.split(/\s+/)[0] || 'there'
  const eventUrl = `${siteUrl}/events/${input.eventSlug}`
  const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, input.unsubToken, true)

  const eventDate = input.startsAt.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const eventTime = input.startsAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const html = buildEventRegistrationEmailHtml({
    siteUrl,
    firstName,
    eventTitle: input.eventTitle,
    eventDate,
    eventTime,
    eventLocation: input.location || undefined,
    eventUrl,
    unsubscribeUrl,
    customMessage: input.confirmEmailBody || undefined,
  })

  const subject =
    input.confirmEmailSubject?.trim() || `You're registered — ${input.eventTitle}`

  const { error } = await resend.emails.send({
    from: getEmailFrom('Afroqueens FM'),
    to: [input.email],
    subject,
    html,
  })

  if (error) throw new Error(error.message)
}
