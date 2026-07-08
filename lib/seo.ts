// lib/seo.ts
import { Metadata } from 'next'

const BASE = 'https://afroqueens.fm'
const SITE_NAME = 'Afroqueens FM'
const DEFAULT_DESC = 'Afroqueens FM — The home of African music, culture, and podcast episodes celebrating women in Afrobeats and beyond.'
const DEFAULT_IMAGE = `${BASE}/og-default.jpg`

export function buildMetadata({
  title,
  description = DEFAULT_DESC,
  slug = '',
  image = DEFAULT_IMAGE,
  type = 'website',
}: {
  title: string
  description?: string
  slug?: string
  image?: string
  type?: 'website' | 'article' | 'music.song'
}): Metadata {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const url = slug ? `${BASE}/${slug}` : BASE

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  }
}

// ── JSON-LD helpers ────────────────────────────────────────────────────────────

export function articleJsonLd({
  title,
  description,
  slug,
  image,
  publishedAt,
  updatedAt,
}: {
  title: string
  description: string
  slug: string
  image?: string
  publishedAt: Date
  updatedAt: Date
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: `${BASE}/blog/${slug}`,
    image: image ?? DEFAULT_IMAGE,
    datePublished: publishedAt.toISOString(),
    dateModified: updatedAt.toISOString(),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
    },
    author: { '@type': 'Organization', name: SITE_NAME },
  }
}

export function podcastEpisodeJsonLd({
  id,
  title,
  description,
  audioUrl,
  image,
  releaseDate,
  duration,
}: {
  id: string
  title: string
  description: string
  audioUrl?: string | null
  image?: string | null
  releaseDate: Date
  duration: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: title,
    description,
    url: `${BASE}/episodes/${id}`,
    image: image ?? DEFAULT_IMAGE,
    datePublished: releaseDate.toISOString(),
    timeRequired: `PT${duration.replace(':', 'M')}S`,
    associatedMedia: audioUrl
      ? { '@type': 'MediaObject', contentUrl: audioUrl, encodingFormat: 'audio/mpeg' }
      : undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: SITE_NAME,
      url: `${BASE}/episodes`,
    },
  }
}

export function artistJsonLd({
  name,
  slug,
  bio,
  genre,
  image,
}: {
  name: string
  slug: string
  bio?: string | null
  genre: string
  image?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name,
    url: `${BASE}/artists/${slug}`,
    description: bio ?? `${name} — ${genre} artist on ${SITE_NAME}`,
    genre,
    image: image ?? DEFAULT_IMAGE,
  }
}
