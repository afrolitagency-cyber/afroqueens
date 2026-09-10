// lib/resend.ts
import { Resend } from 'resend'

let client: Resend | null = null

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!client) client = new Resend(key)
  return client
}

const CANONICAL_FROM_EMAIL = 'noreply@afroqueensng.com'
const CANONICAL_FROM_NAME = 'Afroqueens FM'
const CANONICAL_SITE_URL = 'https://afroqueensng.com'

function looksLikeEmail(value: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)
}

/** Always return `Name <email@domain>` so Resend does not reject the from field. */
export function getEmailFrom(displayName?: string): string {
  const raw = (process.env.EMAIL_FROM || '').trim().replace(/^['"]|['"]$/g, '')
  const angled = raw.match(/<([^>]+)>/)
  const extracted = (angled?.[1] || raw).trim()
  const email = looksLikeEmail(extracted) ? extracted : CANONICAL_FROM_EMAIL

  const nameFromEnv = raw.includes('<')
    ? raw.slice(0, raw.indexOf('<')).trim().replace(/^['"]|['"]$/g, '')
    : ''
  const name = (displayName?.trim() || nameFromEnv || CANONICAL_FROM_NAME).replace(/"/g, '')

  return `${name} <${email}>`
}

export function getSiteUrl(): string {
  const raw = (process.env.NEXTAUTH_URL || process.env.SITE_URL || '').replace(/\/$/, '')
  if (raw && /localhost|127\.0\.0\.1/.test(raw)) return raw
  // Ignore leftover Vercel preview URLs — invites and email links should use the live domain
  if (!raw || /vercel\.app/i.test(raw)) return CANONICAL_SITE_URL
  return raw
}
