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

export function getSiteUrl(): string {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}
