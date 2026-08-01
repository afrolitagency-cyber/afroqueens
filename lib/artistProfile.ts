// lib/artistProfile.ts — shared pending-profile helpers for artist portal

import { spotifyTrackUrl, youtubeWatchUrl } from '@/lib/mediaIds'

export type StreamSourceValue = 'SPOTIFY' | 'YOUTUBE' | 'SOUNDCLOUD' | 'CUSTOM'

export type ArtistProfileFields = {
  name: string
  genre: string
  location: string
  monthlyListeners: string | null
  bio: string | null
  profileImageUrl: string | null
  streamSource: StreamSourceValue
  spotifyTrackId: string | null
  youtubeVideoId: string | null
  soundcloudUrl: string | null
  customAudioUrl: string | null
  instagramUrl: string | null
  twitterUrl: string | null
  tiktokUrl: string | null
  facebookUrl: string | null
  releaseUrl: string | null
}

export function pickLiveProfile(artist: ArtistProfileFields): ArtistProfileFields {
  return {
    name: artist.name,
    genre: artist.genre,
    location: artist.location,
    monthlyListeners: artist.monthlyListeners,
    bio: artist.bio,
    profileImageUrl: artist.profileImageUrl,
    streamSource: artist.streamSource,
    spotifyTrackId: artist.spotifyTrackId,
    youtubeVideoId: artist.youtubeVideoId,
    soundcloudUrl: artist.soundcloudUrl,
    customAudioUrl: artist.customAudioUrl,
    instagramUrl: artist.instagramUrl,
    twitterUrl: artist.twitterUrl,
    tiktokUrl: artist.tiktokUrl,
    facebookUrl: artist.facebookUrl,
    releaseUrl: artist.releaseUrl,
  }
}

export function resolveEditableProfile(
  artist: ArtistProfileFields & { pendingProfile?: unknown },
): ArtistProfileFields {
  const live = pickLiveProfile(artist)
  const pending = artist.pendingProfile
  const merged =
    !pending || typeof pending !== 'object'
      ? live
      : { ...live, ...(pending as Partial<ArtistProfileFields>) }

  return {
    ...merged,
    youtubeVideoId: youtubeWatchUrl(merged.youtubeVideoId) ?? merged.youtubeVideoId,
    spotifyTrackId: spotifyTrackUrl(merged.spotifyTrackId) ?? merged.spotifyTrackId,
  }
}
