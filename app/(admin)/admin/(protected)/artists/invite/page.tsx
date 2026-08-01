// app/(admin)/admin/(protected)/artists/invite/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import InviteArtistForm from './InviteArtistForm'
import styles from '../../shared.module.css'

export const dynamic = 'force-dynamic'

export default async function InviteArtistPage({
  searchParams,
}: {
  searchParams?: { artistId?: string }
}) {
  const artists = await prisma.artist.findMany({
    where: { account: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const initialArtistId = searchParams?.artistId
    && artists.some(a => a.id === searchParams.artistId)
    ? searchParams.artistId
    : undefined

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Invite Artist</h1>
          <p className={styles.pageDesc}>
            Create a new artist and email them a portal invite — or invite someone whose profile
            already exists.
          </p>
        </div>
        <Link href="/admin/artists" className={styles.secondaryBtn}>← Artists</Link>
      </div>

      <InviteArtistForm artists={artists} initialArtistId={initialArtistId} />
    </div>
  )
}
