// lib/dbPing.ts — lightweight Neon/Postgres keep-alive query
import { prisma } from './prisma'

export async function pingDatabase(): Promise<{ latencyMs: number }> {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  return { latencyMs: Date.now() - start }
}
