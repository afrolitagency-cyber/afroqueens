// lib/artistLinks.ts

export interface ArtistLinkFields {
  instagramUrl?: string | null
  twitterUrl?: string | null
  tiktokUrl?: string | null
  facebookUrl?: string | null
  releaseUrl?: string | null
}

export function normalizeArtistUrl(value?: string | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const ARTIST_SOCIAL_LINKS = [
  { key: 'instagramUrl' as const, label: 'Instagram', placeholder: 'instagram.com/username', short: 'IG' },
  { key: 'twitterUrl' as const, label: 'X / Twitter', placeholder: 'x.com/username', short: 'X' },
  { key: 'tiktokUrl' as const, label: 'TikTok', placeholder: 'tiktok.com/@username', short: 'TT' },
  { key: 'facebookUrl' as const, label: 'Facebook', placeholder: 'facebook.com/username', short: 'FB' },
] as const

export function getArtistSocialLinks(artist: ArtistLinkFields) {
  return ARTIST_SOCIAL_LINKS
    .map(link => {
      const url = normalizeArtistUrl(artist[link.key])
      return url ? { ...link, url } : null
    })
    .filter((item): item is (typeof ARTIST_SOCIAL_LINKS)[number] & { url: string } => item !== null)
}

export function getArtistReleaseUrl(artist: ArtistLinkFields): string | null {
  return normalizeArtistUrl(artist.releaseUrl)
}

export function hasArtistLinks(artist: ArtistLinkFields): boolean {
  return getArtistSocialLinks(artist).length > 0 || Boolean(getArtistReleaseUrl(artist))
}
