// Runs once when the Next.js server starts (dev or `next start`).
// Keeps Neon awake during local dev; use Vercel Cron or an external pinger in production.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return
  if (process.env.DB_KEEP_ALIVE === 'false') return

  const isDev = process.env.NODE_ENV === 'development'
  const forceOn = process.env.DB_KEEP_ALIVE === 'true'
  if (!isDev && !forceOn) return

  const intervalMs = Number(process.env.DB_KEEP_ALIVE_INTERVAL_MS || 4 * 60 * 1000)
  const { pingDatabase } = await import('./lib/dbPing')

  const ping = () => {
    pingDatabase()
      .then(({ latencyMs }) => {
        console.log(`[db-keepalive] ok (${latencyMs}ms)`)
      })
      .catch(err => {
        console.warn('[db-keepalive] failed:', err instanceof Error ? err.message : err)
      })
  }

  ping()
  setInterval(ping, intervalMs)
  console.log(`[db-keepalive] pinging every ${Math.round(intervalMs / 1000)}s`)
}
