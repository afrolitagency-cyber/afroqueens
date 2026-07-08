// lib/dbRetry.ts — retry transient Neon / Postgres connection drops
import { Prisma } from '@prisma/client'

const TRANSIENT_CODES = new Set(['P1001', 'P1008', 'P1017'])

export function isTransientDbError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_CODES.has(err.code)
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes("can't reach database server") || msg.includes('connection')
  }
  return false
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function withDbRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (!isTransientDbError(err) || attempt === maxAttempts) throw err
      await sleep(600 * attempt)
    }
  }

  throw lastError
}

export function dbErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P1001') {
      return 'Database connection lost. Your draft is saved locally — try again in a few seconds.'
    }
    return err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong saving to the database.'
}
