// lib/artistInvite.ts
import { randomBytes } from 'crypto'
import { getEmailFrom, getResend, getSiteUrl } from './resend'

export function createInviteToken() {
  return randomBytes(32).toString('hex')
}

export function inviteExpiresAt(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

export function inviteAcceptUrl(token: string) {
  return `${getSiteUrl()}/artist/invite/${token}`
}

export async function sendArtistInviteEmail(opts: {
  to: string
  artistName: string
  token: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const url = inviteAcceptUrl(opts.token)

  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getEmailFrom('Afroqueens FM'),
      to: opts.to,
      subject: `You're invited to manage your ${opts.artistName} profile`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
          <p>Hi,</p>
          <p>You've been invited to manage the <strong>${opts.artistName}</strong> artist profile on Afroqueens FM.</p>
          <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#C8102E;color:#fff;text-decoration:none;border-radius:4px">Set up your account</a></p>
          <p style="font-size:13px;color:#666">Or open this link:<br/>${url}</p>
          <p style="font-size:13px;color:#666">This invite expires in 7 days.</p>
        </div>
      `,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to send invite email',
    }
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendArtistChangesRequestedEmail(opts: {
  to: string
  artistName: string
  note: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const portalUrl = `${getSiteUrl()}/artist`
  const safeNote = escapeHtml(opts.note).replace(/\n/g, '<br/>')

  try {
    const resend = getResend()
    const { error } = await resend.emails.send({
      from: getEmailFrom('Afroqueens FM'),
      to: opts.to,
      subject: `Changes requested on your ${opts.artistName} profile`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:560px">
          <p>Hi ${escapeHtml(opts.artistName)},</p>
          <p>An Afroqueens editor reviewed your profile submission and asked for a few updates before it can go live.</p>
          <div style="margin:1.25rem 0;padding:1rem 1.1rem;background:#fff8f8;border-left:4px solid #C8102E;border-radius:4px">
            <p style="margin:0 0 0.35rem;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C8102E">Editor note</p>
            <p style="margin:0;white-space:pre-wrap">${safeNote}</p>
          </div>
          <p><a href="${portalUrl}" style="display:inline-block;padding:12px 18px;background:#C8102E;color:#fff;text-decoration:none;border-radius:4px">Open your portal</a></p>
          <p style="font-size:13px;color:#666">Update your profile, then submit again for review.</p>
        </div>
      `,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to send changes email',
    }
  }
}
