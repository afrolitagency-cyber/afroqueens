// lib/newsletterEmail.ts — HTML email builder for bulk newsletter sends

export interface NewsletterArticle {
  title: string
  body: string
}

export interface NewsletterPayload {
  subject: string
  previewText?: string
  heroTitle: string
  heroSub?: string
  intro: string
  articles?: NewsletterArticle[]
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

export function buildNewsletterHtml(payload: NewsletterPayload): string {
  const {
    subject,
    previewText,
    heroTitle,
    heroSub,
    intro,
    articles = [],
    signOff,
    ctaText,
    ctaUrl,
    unsubscribeUrl,
    siteUrl,
  } = payload

  const heroHtml = heroTitle
    .split('\n')
    .map(line => escapeHtml(line))
    .join('<br />')

  const articleHtml = articles
    .map(
      a => `
      <tr>
        <td style="padding:0 0 28px 0;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0a0a0a;margin:0 0 8px;">
            ${escapeHtml(a.title)}
          </div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#444;">
            ${nl2br(a.body)}
          </div>
        </td>
      </tr>`,
    )
    .join('')

  const cta = ctaText
    ? `
    <tr>
      <td align="center" style="padding:8px 0 32px;">
        <a href="${escapeHtml(ctaUrl || siteUrl)}"
           style="display:inline-block;background:#C8102E;color:#fff;text-decoration:none;
                  font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;
                  letter-spacing:0.08em;text-transform:uppercase;padding:14px 28px;border-radius:6px;">
          ${escapeHtml(ctaText)}
        </a>
      </td>
    </tr>`
    : ''

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
          <tr>
            <td style="background:#0a0a0a;padding:22px 28px;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;letter-spacing:0.14em;color:#fff;font-weight:700;">
                AFRO<span style="color:#C8102E;">Q</span>UEENS
              </div>
            </td>
          </tr>
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
              ${articles.length ? `
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C8102E;font-weight:700;margin:8px 0 18px;">
                This Month's Highlights
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
          ${cta}
          <tr>
            <td style="background:#f7f4ef;padding:22px 28px;border-top:1px solid #eee;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#888;text-align:center;">
                You're receiving this because you subscribed at Afroqueens FM.<br />
                <a href="${escapeHtml(unsubscribeUrl)}" style="color:#C8102E;">Unsubscribe</a>
                &nbsp;·&nbsp;
                <a href="${escapeHtml(siteUrl)}" style="color:#888;">Visit site</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
