// components/public/Footer.tsx
import Link from 'next/link'
import styles from './Footer.module.css'

const SOCIALS = [
  { label: 'IG', href: 'https://instagram.com/afroqueens' },
  { label: 'TW', href: 'https://twitter.com/afroqueens' },
  { label: 'SP', href: 'https://open.spotify.com' },
  { label: 'YT', href: 'https://youtube.com' },
]

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`si ${styles.inner}`}>
        <div className={styles.logo}>
          AFRO<span>Q</span>UEENS
        </div>
        <div className={styles.copy}>
          © {new Date().getFullYear()} Afroqueens. All rights reserved.
        </div>
        <div className={styles.socials}>
          {SOCIALS.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
