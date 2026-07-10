// lib/newsletterEmail.ts — HTML email builders for newsletter templates

export type NewsletterTemplate = 'frequency' | 'event' | 'plain'

export interface NewsletterArticle {
  title: string
  body: string
  url?: string
}

export interface EventDetails {
  eventName: string
  eventDate: string
  eventTime?: string
  eventLocation?: string
  eventNotes?: string
}

export interface NewsletterPayload {
  subject: string
  previewText?: string
  template?: NewsletterTemplate
  heroTitle: string
  heroSub?: string
  intro: string
  articles?: NewsletterArticle[]
  includeHighlights?: boolean
  event?: EventDetails
  signOff: string
  ctaText?: string
  ctaUrl?: string
  unsubscribeUrl: string
  siteUrl: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br />')
}

function brandHeader(): string {
  return `
  <tr>
    <td style="background:#0a0a0a;padding:22px 28px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;letter-spacing:0.14em;color:#fff;font-weight:700;">
        AFRO<span style="color:#C8102E;">Q</span>UEENS
      </div>
    </td>
  </tr>`
}

function footer(unsubscribeUrl: string, siteUrl: string, note: string): string {
  return `
  <tr>
    <td style="background:#f7f4ef;padding:22px 28px;border-top:1px solid #eee;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#888;text-align:center;">
        ${escapeHtml(note)}<br />
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:#C8102E;">Unsubscribe</a>
        &nbsp;·&nbsp;
        <a href="${escapeHtml(siteUrl)}" style="color:#888;">Visit site</a>
      </div>
    </td>
  </tr>`
}

function ctaBlock(ctaText?: string, ctaUrl?: string, siteUrl?: string): string {
  if (!ctaText) return ''
  return `
  <tr>
    <td align="center" style="padding:8px 0 32px;">
      <a href="${escapeHtml(ctaUrl || siteUrl || '#')}"
         style="display:inline-block;background:#C8102E;color:#fff;text-decoration:none;
                font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;
                letter-spacing:0.08em;text-transform:uppercase;padding:14px 28px;border-radius:6px;">
        ${escapeHtml(ctaText)}
      </a>
    </td>
  </tr>`
}

function wrapEmail(subject: string, previewText: string | undefined, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe9;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>` : ''}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4efe9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
          ${inner}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildFrequencyHtml(payload: NewsletterPayload): string {
  const {
    subject,
    previewText,
    heroTitle,
    heroSub,
    intro,
    articles = [],
    includeHighlights = true,
    signOff,
    ctaText,
    ctaUrl,
    unsubscribeUrl,
    siteUrl,
  } = payload

  const heroHtml = heroTitle.split('\n').map(line => escapeHtml(line)).join('<br />')
  const showArticles = includeHighlights && articles.length > 0

  const articleHtml = articles
    .map(
      a => `
      <tr>
        <td style="padding:0 0 28px 0;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">
            ${a.url ? `<a href="${escapeHtml(a.url)}" style="color:#0a0a0a;text-decoration:none;">${escapeHtml(a.title)}</a>` : escapeHtml(a.title)}
          </div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#444;">
            ${nl2br(a.body)}
          </div>
          ${a.url ? `<div style="margin-top:10px;"><a href="${escapeHtml(a.url)}" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#C8102E;text-decoration:none;">Read more →</a></div>` : ''}
        </td>
      </tr>`,
    )
    .join('')

  const inner = `
    ${brandHeader()}
    <tr>
      <td style="background:#C8102E;padding:36px 28px;color:#fff;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;margin-bottom:10px;">
          Monthly Newsletter
        </div>
        <div style="font-family:Georgia,serif;font-size:28px;line-height:1.25;font-weight:700;margin:0 0 10px;">
          ${heroHtml}
        </div>
        ${heroSub ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;opacity:0.92;">${escapeHtml(heroSub)}</div>` : ''}
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 8px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:24px;">
          ${nl2br(intro)}
        </div>
        ${showArticles ? `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C8102E;font-weight:700;margin:8px 0 18px;">
          Latest stories
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${articleHtml}
        </table>` : ''}
        <div style="height:1px;background:#eee;margin:8px 0 24px;"></div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:8px;">
          ${nl2br(signOff)}
        </div>
      </td>
    </tr>
    ${ctaBlock(ctaText, ctaUrl, siteUrl)}
    ${footer(unsubscribeUrl, siteUrl, "You're receiving this because you subscribed at Afroqueens FM.")}`

  return wrapEmail(subject, previewText, inner)
}

function buildEventHtml(payload: NewsletterPayload): string {
  const {
    subject,
    previewText,
    heroTitle,
    intro,
    event,
    signOff,
    ctaText,
    ctaUrl,
    unsubscribeUrl,
    siteUrl,
  } = payload

  const rows = [
    event?.eventName ? ['Event', event.eventName] : null,
    event?.eventDate ? ['Date', event.eventDate] : null,
    event?.eventTime ? ['Time', event.eventTime] : null,
    event?.eventLocation ? ['Location', event.eventLocation] : null,
  ].filter(Boolean) as [string, string][]

  const detailsHtml = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#888;width:110px;vertical-align:top;">
          ${escapeHtml(label)}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0a0a0a;font-weight:600;">
          ${escapeHtml(value)}
        </td>
      </tr>`,
    )
    .join('')

  const notesHtml = event?.eventNotes
    ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#555;margin-top:18px;padding:14px 16px;background:#faf7f3;border-radius:8px;">${nl2br(event.eventNotes)}</div>`
    : ''

  const inner = `
    ${brandHeader()}
    <tr>
      <td style="background:#0a0a0a;padding:36px 28px;color:#fff;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#C8102E;margin-bottom:10px;">
          Registration confirmed
        </div>
        <div style="font-family:Georgia,serif;font-size:26px;line-height:1.3;font-weight:700;">
          ${escapeHtml(heroTitle)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px 8px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:22px;">
          ${nl2br(intro)}
        </div>
        ${detailsHtml ? `
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C8102E;font-weight:700;margin:0 0 8px;">
          Event details
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
          ${detailsHtml}
        </table>` : ''}
        ${notesHtml}
        <div style="height:1px;background:#eee;margin:24px 0;"></div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:8px;">
          ${nl2br(signOff)}
        </div>
      </td>
    </tr>
    ${ctaBlock(ctaText, ctaUrl, siteUrl)}
    ${footer(unsubscribeUrl, siteUrl, "You're receiving this because you registered for an Afroqueens event.")}`

  return wrapEmail(subject, previewText, inner)
}

function buildPlainHtml(payload: NewsletterPayload): string {
  const {
    subject,
    previewText,
    heroTitle,
    intro,
    signOff,
    ctaText,
    ctaUrl,
    unsubscribeUrl,
    siteUrl,
  } = payload

  const inner = `
    ${brandHeader()}
    <tr>
      <td style="padding:36px 28px 8px;">
        <div style="font-family:Georgia,serif;font-size:24px;line-height:1.3;font-weight:700;color:#0a0a0a;margin:0 0 18px;">
          ${escapeHtml(heroTitle)}
        </div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:24px;">
          ${nl2br(intro)}
        </div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#333;margin-bottom:8px;">
          ${nl2br(signOff)}
        </div>
      </td>
    </tr>
    ${ctaBlock(ctaText, ctaUrl, siteUrl)}
    ${footer(unsubscribeUrl, siteUrl, "You're receiving this from Afroqueens FM.")}`

  return wrapEmail(subject, previewText, inner)
}

export function buildNewsletterHtml(payload: NewsletterPayload): string {
  const template = payload.template || 'frequency'
  if (template === 'event') return buildEventHtml(payload)
  if (template === 'plain') return buildPlainHtml(payload)
  return buildFrequencyHtml(payload)
}

export function buildUnsubscribeUrl(siteUrl: string, tokenOrEmail: string, useToken = true): string {
  const base = `${siteUrl}/api/newsletter/unsubscribe`
  if (useToken) return `${base}?token=${encodeURIComponent(tokenOrEmail)}`
  return `${base}?email=${encodeURIComponent(tokenOrEmail)}`
}

export function buildConfirmUrl(siteUrl: string, token: string): string {
  return `${siteUrl}/api/newsletter/confirm?token=${encodeURIComponent(token)}`
}

export function buildConfirmEmailHtml(siteUrl: string, token: string): string {
  const url = buildConfirmUrl(siteUrl, token)
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4efe9;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;padding:32px;border-radius:10px;">
    <h1 style="font-size:1.4rem;color:#0a0a0a;">Confirm your subscription</h1>
    <p style="color:#444;line-height:1.6;">Click below to confirm you want Afroqueens FM newsletter updates.</p>
    <a href="${url}" style="display:inline-block;background:#C8102E;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:700;margin-top:12px;">Confirm subscription</a>
    <p style="color:#888;font-size:12px;margin-top:24px;">If you didn't request this, ignore this email.</p>
  </div></body></html>`
}

export function buildEventRegistrationEmailHtml(input: {
  siteUrl: string
  firstName: string
  eventTitle: string
  eventDate: string
  eventTime?: string
  eventLocation?: string
  eventUrl: string
  unsubscribeUrl: string
  /** Custom intro / notes for this event (supports newlines). */
  customMessage?: string
}): string {
  const rows = [
    ['Event', input.eventTitle],
    ['Date', input.eventDate],
    input.eventTime ? ['Time', input.eventTime] : null,
    input.eventLocation ? ['Location', input.eventLocation] : null,
  ].filter(Boolean) as [string, string][]

  const details = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.08em;width:100px;">${escapeHtml(label)}</td><td style="padding:8px 0;font-weight:600;color:#0a0a0a;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')

  const intro = input.customMessage?.trim()
    ? nl2br(input.customMessage.trim())
    : 'Thanks for registering. Save these details for the upcoming event.'

  const notesBlock = input.customMessage?.trim()
    ? `<div style="margin:18px 0 0;padding:14px 16px;background:#faf7f3;border-radius:8px;font-size:14px;line-height:1.7;color:#444;">${nl2br(input.customMessage.trim())}</div>`
    : ''

  // If custom message is set, use a short default intro + notes box; otherwise single default paragraph
  const bodyIntro = input.customMessage?.trim()
    ? `<p style="color:#444;line-height:1.7;margin:0 0 12px;">Thanks for registering for <strong>${escapeHtml(input.eventTitle)}</strong>.</p>${notesBlock}`
    : `<p style="color:#444;line-height:1.7;margin:0 0 20px;">${intro}</p>`

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4efe9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center">
  <table width="560" style="max-width:560px;width:100%;background:#fff;border-radius:10px;overflow:hidden;">
    <tr><td style="background:#0a0a0a;padding:22px 28px;color:#fff;font-size:18px;letter-spacing:.12em;font-weight:700;">AFRO<span style="color:#C8102E;">Q</span>UEENS</td></tr>
    <tr><td style="padding:32px 28px;">
      <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#C8102E;margin-bottom:8px;">Registration confirmed</div>
      <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;color:#0a0a0a;">You're in, ${escapeHtml(input.firstName)}</h1>
      ${bodyIntro}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">${details}</table>
      <p style="margin:24px 0 0;"><a href="${escapeHtml(input.eventUrl)}" style="display:inline-block;background:#C8102E;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700;font-size:13px;">View event</a></p>
    </td></tr>
    <tr><td style="background:#f7f4ef;padding:18px 28px;font-size:12px;color:#888;text-align:center;">
      You're receiving this because you registered for an Afroqueens event.<br/>
      <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#C8102E;">Unsubscribe</a>
    </td></tr>
  </table>
  </td></tr></table>
  </body></html>`
}
