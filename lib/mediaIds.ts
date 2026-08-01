/** Extract a YouTube video ID from a raw ID or any common YouTube URL. */
export function extractYoutubeVideoId(input: string | null | undefined): string | null {
  if (!input) return null
  const raw = input.trim()
  if (!raw) return null

  const fromUrl = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (fromUrl) return fromUrl[1]

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  return null
}

/** Canonical watch URL for display / form fields (storage still uses the ID). */
export function youtubeWatchUrl(input: string | null | undefined): string | null {
  const id = extractYoutubeVideoId(input)
  return id ? `https://www.youtube.com/watch?v=${id}` : null
}

/** Extract a Spotify track ID from a raw ID or open.spotify.com URL. */
export function extractSpotifyTrackId(input: string | null | undefined): string | null {
  if (!input) return null
  const raw = input.trim()
  if (!raw) return null

  const fromUrl = raw.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/)
  if (fromUrl) return fromUrl[1]

  if (/^[a-zA-Z0-9]{22}$/.test(raw)) return raw

  // Fallback: accept other non-URL IDs the CMS already stored
  if (!raw.includes('/') && !raw.includes('?') && !raw.includes('http')) return raw

  return null
}

export function spotifyTrackUrl(input: string | null | undefined): string | null {
  const id = extractSpotifyTrackId(input)
  return id ? `https://open.spotify.com/track/${id}` : null
}
