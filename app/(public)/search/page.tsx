// app/(public)/search/page.tsx
import { Suspense } from 'react'
import SearchResults from './SearchResults'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Search — Afroqueens FM',
  description: 'Search artists, episodes, and articles on Afroqueens FM.',
  slug: 'search',
})

export default function SearchPage() {
  return (
    <Suspense fallback={<main style={{ paddingTop: '110px', minHeight: '80vh' }} />}>
      <SearchResults />
    </Suspense>
  )
}
