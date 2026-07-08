// app/(public)/artists/page.tsx
import { prisma } from '@/lib/prisma'
import ArtistsGrid from '@/components/public/artists/ArtistsGrid'
import styles from './artists.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Artists — Afroqueens FM',
  description: '280+ artists documented, celebrated, and amplified. Discover the women shaping African music.',
  slug: 'artists',
})

export const revalidate = 60

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
    select: {
      id: true, name: true, slug: true, genre: true,
      location: true, monthlyListeners: true, profileImageUrl: true,
    },
  })

  return (
    <main style={{ paddingTop: '100px' }}>
      <div className={styles.pageHero}>
        <div className={`si ${styles.heroInner}`}>
          <div className="sl">The Roster</div>
          <h1 className="st">The <em>Voices</em></h1>
          <p className={styles.heroDesc}>
            {artists.length}+ artists documented, celebrated, and amplified.
            This is the living archive of African sound.
          </p>
        </div>
      </div>

      <div className="si" style={{ padding: '5rem 4rem' }}>
        <ArtistsGrid artists={artists} />
      </div>
    </main>
  )
}
