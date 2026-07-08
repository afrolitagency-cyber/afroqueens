// lib/images.ts — size-aware cover URLs for mixed image sources

export type CoverSize = 'thumb' | 'card' | 'hero'

const WIDTHS: Record<CoverSize, number> = {
  thumb: 96,
  card:  400,
  hero:  1200,
}

function isCloudinaryUrl(url: URL): boolean {
  return url.hostname === 'res.cloudinary.com'
}

function isUnsplashUrl(url: URL): boolean {
  return url.hostname === 'images.unsplash.com'
}

function cloudinaryHasTransform(pathname: string): boolean {
  const afterUpload = pathname.split('/upload/')[1]
  if (!afterUpload) return false
  const firstSegment = afterUpload.split('/')[0] ?? ''
  return firstSegment.includes(',') || /^w_\d/.test(firstSegment)
}

function sizedUnsplashUrl(url: URL, width: number): string {
  url.searchParams.set('w', String(width))
  url.searchParams.set('q', '80')
  url.searchParams.set('auto', 'format')
  return url.toString()
}

function sizedCloudinaryUrl(url: URL, width: number): string {
  if (cloudinaryHasTransform(url.pathname)) return url.toString()

  const transform = `w_${width},c_limit,q_auto,f_auto`
  url.pathname = url.pathname.replace('/upload/', `/upload/${transform}/`)
  return url.toString()
}

/** Return a width-appropriate cover URL, or undefined when url is empty. */
export function getCoverUrl(
  url: string | null | undefined,
  size: CoverSize = 'card',
): string | undefined {
  if (!url) return undefined

  const width = WIDTHS[size]

  try {
    const parsed = new URL(url)
    if (isUnsplashUrl(parsed)) return sizedUnsplashUrl(parsed, width)
    if (isCloudinaryUrl(parsed)) return sizedCloudinaryUrl(parsed, width)
    return url
  } catch {
    return url
  }
}
