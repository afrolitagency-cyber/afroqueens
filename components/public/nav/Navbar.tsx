'use client'
// components/public/nav/Navbar.tsx
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Navbar.module.css'

const LINKS = [
  { href: '/',         label: 'Home'     },
  { href: '/about',    label: 'About'    },
  { href: '/artists',  label: 'Artists'  },
  { href: '/blog',     label: 'Blog'     },
  { href: '/gallery',  label: 'Gallery'  },
  { href: '/episodes', label: 'Episodes' },
]

export default function Navbar() {
  const [open,        setOpen]        = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const submitSearch = () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <nav className={styles.nav}>
        {/* Design 1 logo */}
        <Link href="/" className={styles.logoD1}>
          AFRO<span>Q</span>UEENS
        </Link>

        {/* Design 2 logo */}
        <Link href="/" className={styles.logoD2}>
          AFROQUEENS <span className={styles.lpill}>FM</span>
        </Link>

        {/* Desktop links */}
        <ul className={styles.links}>
          {LINKS.map(l => (
            <li key={l.href}>
              <Link href={l.href} className={styles.link}>{l.label}</Link>
            </li>
          ))}
          <li>
            <Link href="/contact" className={`${styles.link} ${styles.cta1}`}>Contact</Link>
          </li>
          <li>
            <Link href="/contact" className={`${styles.link} ${styles.cta2}`}>Contact</Link>
          </li>
        </ul>

        {/* Search icon */}
        <button
          className={styles.searchBtn}
          onClick={() => setSearchOpen(s => !s)}
          aria-label="Search"
        >
          ⌕
        </button>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${open ? styles.open : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Search dropdown */}
      {searchOpen && (
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            placeholder="Search artists, episodes, articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSearch()}
            autoFocus
          />
          <button className={styles.searchGo} onClick={submitSearch}>Search</button>
          <button className={styles.searchClose} onClick={() => setSearchOpen(false)}>✕</button>
        </div>
      )}

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.mobDiv} />
        {LINKS.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            className={styles.mobLink}
            style={{ transitionDelay: `${(i + 1) * 0.04}s` }}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/contact"
          className={styles.mobLink}
          style={{ transitionDelay: `${(LINKS.length + 1) * 0.04}s` }}
          onClick={() => setOpen(false)}
        >
          Contact
        </Link>
        <Link
          href="/search"
          className={styles.mobLink}
          style={{ transitionDelay: `${(LINKS.length + 2) * 0.04}s` }}
          onClick={() => setOpen(false)}
        >
          Search
        </Link>
        <div className={styles.mobDiv} />
      </div>
    </>
  )
}
