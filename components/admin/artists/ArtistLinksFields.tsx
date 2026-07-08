'use client'

import styles from '@/app/(admin)/admin/(protected)/artists/artists.module.css'
import { ARTIST_SOCIAL_LINKS } from '@/lib/artistLinks'

export interface ArtistLinksValues {
  instagramUrl: string
  twitterUrl: string
  tiktokUrl: string
  facebookUrl: string
  releaseUrl: string
}

interface Props {
  values: ArtistLinksValues
  onChange: (key: keyof ArtistLinksValues, value: string) => void
}

export default function ArtistLinksFields({ values, onChange }: Props) {
  return (
    <div className={styles.linksSection}>
      <div className={styles.streamLabel}>Links</div>
      <p className={styles.streamHint}>
        Social profiles and release links shown on the artist&apos;s public page.
      </p>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>OUT NOW / Release Link</label>
        <input
          value={values.releaseUrl}
          onChange={e => onChange('releaseUrl', e.target.value)}
          className={styles.input}
          placeholder="e.g. funfillage.lnk.to/synallinorder"
        />
        <p className={styles.hint}>Smart link, album page, or distro link — shown as a prominent button.</p>
      </div>

      {ARTIST_SOCIAL_LINKS.map(link => (
        <div key={link.key} className={styles.fieldGroup}>
          <label className={styles.label}>{link.label}</label>
          <input
            value={values[link.key]}
            onChange={e => onChange(link.key, e.target.value)}
            className={styles.input}
            placeholder={link.placeholder}
          />
        </div>
      ))}
    </div>
  )
}
