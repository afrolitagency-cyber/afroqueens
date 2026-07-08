// lib/keepAlive.ts — ping Neon DB + Supabase Storage to prevent free-tier sleep
import { prisma } from './prisma'
import { supabase } from './supabase'

export type KeepAliveResult = {
  database?: { ok: true; latencyMs: number } | { ok: false; error: string }
  supabaseStorage?: { ok: true; latencyMs: number } | { ok: false; error: string }
}

function audioBucket(): string {
  return process.env.SUPABASE_AUDIO_BUCKET || 'afroqueens-audio'
}

export async function pingDatabase(): Promise<{ latencyMs: number }> {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  return { latencyMs: Date.now() - start }
}

/** Lightweight Storage API call so the Supabase project stays active. */
export async function pingSupabaseStorage(): Promise<{ latencyMs: number }> {
  const start = Date.now()
  const bucket = audioBucket()
  const { error } = await supabase.storage.from(bucket).list('', {
    limit: 1,
    offset: 0,
  })
  if (error) throw new Error(error.message)
  return { latencyMs: Date.now() - start }
}

/** Ping both services; never throws — reports per-service status. */
export async function pingKeepAliveServices(): Promise<KeepAliveResult> {
  const result: KeepAliveResult = {}

  try {
    const { latencyMs } = await pingDatabase()
    result.database = { ok: true, latencyMs }
  } catch (err) {
    result.database = {
      ok: false,
      error: err instanceof Error ? err.message : 'Database unreachable',
    }
  }

  try {
    const { latencyMs } = await pingSupabaseStorage()
    result.supabaseStorage = { ok: true, latencyMs }
  } catch (err) {
    result.supabaseStorage = {
      ok: false,
      error: err instanceof Error ? err.message : 'Supabase Storage unreachable',
    }
  }

  return result
}

export function keepAliveSucceeded(result: KeepAliveResult): boolean {
  return Boolean(result.database?.ok && result.supabaseStorage?.ok)
}
