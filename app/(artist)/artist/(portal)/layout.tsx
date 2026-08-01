// app/(artist)/artist/(portal)/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from '../artist.module.css'

export default async function ArtistPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/artist/login')
  if (session.user.role !== 'ARTIST' || !session.user.artistId) {
    redirect('/artist/login')
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>AQ</span>
          <div>
            <div className={styles.brandName}>Artist Portal</div>
            <div className={styles.brandSub}>{session.user.name || session.user.email}</div>
          </div>
        </div>
        <div className={styles.topActions}>
          <Link href="/artists" className={styles.ghostBtn} target="_blank">
            View site
          </Link>
          <Link href="/api/auth/signout?callbackUrl=/artist/login" className={styles.ghostBtn}>
            Sign out
          </Link>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
