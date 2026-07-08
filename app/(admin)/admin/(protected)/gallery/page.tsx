// app/(admin)/admin/gallery/page.tsx
import { prisma } from '@/lib/prisma'
import GalleryAdminClient from './GalleryAdminClient'

export default async function AdminGalleryPage() {
  const items = await prisma.galleryItem.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  })
  return <GalleryAdminClient initialItems={items} />
}
