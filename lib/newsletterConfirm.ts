// lib/newsletterConfirm.ts
import { getEmailFrom, getResend, getSiteUrl } from './resend'
import { buildConfirmEmailHtml } from './newsletterEmail'

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
