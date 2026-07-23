'use client'
// components/player/NowPlaying.tsx
import { useState, useEffect, useRef } from 'react'
import { extractSpotifyTrackId, extractYoutubeVideoId } from '@/lib/mediaIds'
import styles from './NowPlaying.module.css'

interface NowPlayingProps {
  artist: {
    name: string
    streamSource: 'SPOTIFY' | 'YOUTUBE' | 'SOUNDCLOUD' | 'CUSTOM'
    spotifyTrackId?: string | null
    youtubeVideoId?: string | null
    soundcloudUrl?: string | null
    customAudioUrl?: string | null
    trackTitle?: string
  } | null
}

export default function NowPlaying({ artist }: NowPlayingProps) {
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const ytRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // Fade in after 3s (matching original HTML)
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!artist) return null

  const youtubeId = extractYoutubeVideoId(artist.youtubeVideoId)
  const spotifyId = extractSpotifyTrackId(artist.spotifyTrackId)
  const trackTitle = artist.trackTitle ?? `${artist.name} — Latest Track`

  const handlePlay = () => {
    if (artist.streamSource === 'CUSTOM' && audioRef.current) {
      if (playing) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setPlaying(!playing)
    }
    // YouTube & Spotify controlled via postMessage to iframes
    if (artist.streamSource === 'YOUTUBE' && ytRef.current) {
      const cmd = playing ? 'pauseVideo' : 'playVideo'
      ytRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: cmd, args: [] }),
        '*'
      )
      setPlaying(!playing)
    }
  }

  return (
    <>
      {/* Hidden players */}
      {artist.streamSource === 'CUSTOM' && artist.customAudioUrl && (
        <audio
          ref={audioRef}
          src={artist.customAudioUrl}
          onEnded={() => setPlaying(false)}
        />
      )}

      {artist.streamSource === 'YOUTUBE' && youtubeId && (
        <iframe
          ref={ytRef}
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0`}
          style={{ display: 'none' }}
          allow="autoplay"
          title="YouTube player"
        />
      )}

      {artist.streamSource === 'SPOTIFY' && spotifyId && (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyId}`}
          style={{ display: 'none' }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="Spotify player"
        />
      )}

      {/* Now Playing UI */}
      <div
        className={`${styles.np} ${visible ? styles.visible : ''}`}
        onClick={handlePlay}
      >
        <div className={styles.bars}>
          {[1,2,3,4].map(i => (
            <div
              key={i}
              className={`${styles.bar} ${playing ? styles.playing : ''}`}
              style={{ animationDelay: `${(i-1) * 0.15}s` }}
            />
          ))}
        </div>
        <div className={styles.info}>
          <div className={styles.label}>Now Playing</div>
          <div className={styles.track}>{trackTitle}</div>
        </div>
        <button className={styles.playBtn} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
