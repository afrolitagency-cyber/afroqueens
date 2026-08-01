// app/(artist)/artist/(portal)/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { resolveEditableProfile } from '@/lib/artistProfile'
import ProfileEditor from './ProfileEditor'

export const dynamic = 'force-dynamic'

export default async function ArtistPortalPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.artistId) redirect('/artist/login')

  const artist = await prisma.artist.findUnique({
    where: { id: session.user.artistId },
    include: {
      releases: {
        orderBy: [{ order: 'asc' }, { year: 'desc' }],
        include: { tracks: { orderBy: { number: 'asc' } } },
      },
    },
  })
  if (!artist) redirect('/artist/login')

  const initial = resolveEditableProfile(artist)

  return (
    <ProfileEditor
      initial={initial}
      reviewStatus={artist.reviewStatus}
      reviewNote={artist.reviewNote}
      publicSlug={artist.slug}
      artistId={artist.id}
      releases={artist.releases}
    />
  )
}
