// Runs once when the Next.js server starts (dev or `next start`).
// Keeps Neon + Supabase awake during local dev; use external pinger in production.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') return
  if (process.env.DB_KEEP_ALIVE === 'false') return

  const isDev = process.env.NODE_ENV === 'development'
  const forceOn = process.env.DB_KEEP_ALIVE === 'true'
  if (!isDev && !forceOn) return

  const intervalMs = Number(process.env.DB_KEEP_ALIVE_INTERVAL_MS || 4 * 60 * 1000)
  const { pingKeepAliveServices, keepAliveSucceeded } = await import('./lib/keepAlive')

  const ping = () => {
    pingKeepAliveServices()
      .then(result => {
        if (keepAliveSucceeded(result)) {
          const db = result.database && 'latencyMs' in result.database ? result.database.latencyMs : '?'
          const storage =
            result.supabaseStorage && 'latencyMs' in result.supabaseStorage
              ? result.supabaseStorage.latencyMs
              : '?'
          console.log(`[keep-alive] ok db=${db}ms storage=${storage}ms`)
          return
        }
        console.warn('[keep-alive] partial failure:', result)
      })
      .catch(err => {
        console.warn('[keep-alive] failed:', err instanceof Error ? err.message : err)
      })
  }

  ping()
  setInterval(ping, intervalMs)
  console.log(`[keep-alive] pinging db + supabase storage every ${Math.round(intervalMs / 1000)}s`)
}
