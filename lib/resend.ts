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

export function getEmailFrom(displayName?: string): string {
  const raw = process.env.EMAIL_FROM || 'Afroqueens <onboarding@resend.dev>'
  if (!displayName?.trim()) return raw

  // Support "Name <email@domain>" or bare email in EMAIL_FROM
  const match = raw.match(/<([^>]+)>/)
  const email = match?.[1] || raw.trim()
  return `${displayName.trim()} <${email}>`
}

const CANONICAL_SITE_URL = 'https://afroqueensng.com'

export function getSiteUrl(): string {
  const raw = (process.env.NEXTAUTH_URL || process.env.SITE_URL || '').replace(/\/$/, '')
  if (raw && /localhost|127\.0\.0\.1/.test(raw)) return raw
  // Ignore leftover Vercel preview URLs — invites and email links should use the live domain
  if (!raw || /vercel\.app/i.test(raw)) return CANONICAL_SITE_URL
  return raw
}
