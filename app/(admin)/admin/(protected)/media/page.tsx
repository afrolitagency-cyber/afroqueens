// app/(admin)/admin/(protected)/media/page.tsx
import { prisma } from '@/lib/prisma'
import MediaAdminClient from './MediaAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const items = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <MediaAdminClient
      initialItems={items.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  )
}
