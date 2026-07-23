// lib/widgetEmbed.ts
import { extractYoutubeVideoId } from '@/lib/mediaIds'

export type WidgetType = 'YOUTUBE' | 'SPOTIFY' | 'SOUNDCLOUD' | 'APPLE_MUSIC' | 'CUSTOM'
export type WidgetPosition = 'LEFT' | 'RIGHT'

export interface PublicWidget {
  id: string
  type: WidgetType
  title: string
  embedUrl: string
  position: WidgetPosition
  createdAt: Date | string
}

export function getEmbedSrc(widget: Pick<PublicWidget, 'type' | 'embedUrl'>): string {
  const url = widget.embedUrl.trim()

  if (widget.type === 'YOUTUBE') {
    const id = extractYoutubeVideoId(url) ?? url
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
  }

  if (widget.type === 'SPOTIFY') {
    if (url.includes('open.spotify.com')) {
      const path = url.replace(/^https?:\/\/open\.spotify\.com/, '')
      return `https://open.spotify.com/embed${path}`
    }
    return url
  }

  if (widget.type === 'SOUNDCLOUD') {
    if (url.includes('w.soundcloud.com')) return url
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23C8102E&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
  }

  if (widget.type === 'APPLE_MUSIC') {
    return url.replace('music.apple.com', 'embed.music.apple.com')
  }

  return url
}

/** Suggested iframe height per embed type */
export function getEmbedHeight(type: WidgetType): number {
  switch (type) {
    case 'YOUTUBE':     return 200
    case 'SPOTIFY':     return 352
    case 'SOUNDCLOUD':  return 166
    case 'APPLE_MUSIC': return 175
    default:            return 280
  }
}

export function sortWidgetsLatestFirst<T extends { createdAt: Date | string }>(widgets: T[]): T[] {
  return [...widgets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
