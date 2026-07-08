// app/(public)/gallery/page.tsx
import { prisma } from '@/lib/prisma'
import GalleryGrid from '@/components/public/gallery/GalleryGrid'
import styles from './gallery.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Gallery — Afroqueens FM',
  description: 'Every frame a story. Every session a moment that deserved to be saved.',
  slug: 'gallery',
})

export const revalidate = 60

export default async function GalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  })

  const categories = [
    { value: 'ALL',              label: 'All' },
    { value: 'LIVE_SESSIONS',    label: 'Live Sessions' },
    { value: 'STUDIO',           label: 'Studio' },
    { value: 'FESTIVALS',        label: 'Festivals' },
    { value: 'PORTRAITS',        label: 'Portraits' },
    { value: 'BEHIND_THE_SCENES', label: 'Behind the Scenes' },
    { value: 'ON_THE_ROAD',      label: 'On the Road' },
  ]

  return (
    <main style={{ paddingTop: '100px' }}>
      <div className={styles.pageHero}>
        <div className={`si ${styles.heroInner}`}>
          <div className="sl">Visual Archive</div>
          <h1 className="st">The <em>Gallery</em></h1>
          <p className={styles.heroDesc}>
            Every frame a story. Every session a moment that deserved to be saved.
          </p>
        </div>
      </div>

      <div className="si" style={{ padding: '5rem 4rem' }}>
        <GalleryGrid items={items} categories={categories} />
      </div>
    </main>
  )
}
