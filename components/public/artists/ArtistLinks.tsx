import Link from 'next/link'
import SocialIcon from '@/components/icons/SocialIcon'
import {
  getArtistSocialLinks,
  getArtistReleaseUrl,
  hasArtistLinks,
  type ArtistLinkFields,
} from '@/lib/artistLinks'
import styles from './ArtistLinks.module.css'

export default function ArtistLinks({ artist }: { artist: ArtistLinkFields }) {
  if (!hasArtistLinks(artist)) return null

  const socials = getArtistSocialLinks(artist)
  const releaseUrl = getArtistReleaseUrl(artist)

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Links</h2>

      {releaseUrl && (
        <a
          href={releaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.releaseBtn}
        >
          OUT NOW ↗
        </a>
      )}

      {socials.length > 0 && (
        <div className={styles.socialRow}>
          {socials.map(link => (
            <Link
              key={link.key}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label={link.label}
              title={link.label}
            >
              <SocialIcon linkKey={link.key} />
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
