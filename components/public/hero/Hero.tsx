'use client'
// components/public/hero/Hero.tsx
import Link from 'next/link'
import HeroSlideshow from './HeroSlideshow'
import styles from './Hero.module.css'

interface HeroProps {
  featuredArtist?: {
    name: string
    genre: string
    location: string
    profileImageUrl: string | null
  } | null
}

export default function Hero({ featuredArtist }: HeroProps) {
  return (
    <>
      {/* ── DESIGN 1 HERO ── */}
      <section className={styles.heroD1}>
        <HeroSlideshow variant="full" />
        <div className={styles.h1Accent} />

        <div className={styles.h1Content}>
          <div className={styles.h1Eyebrow}>Live from the underground</div>
          <h1 className={styles.h1Title}>
            WHERE<br /><em>SOUND</em><br />BECOMES<br />ART
          </h1>
          <p className={styles.h1Desc}>
            Afroqueens is your gateway to the beating pulse of the global music
            scene — curated events, emerging artists, and conversations that cut
            through the noise.
          </p>
          <div className={styles.h1Actions}>
            <Link href="/episodes" className="btn-p">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Latest Episodes
            </Link>
            <Link href="/artists" className="btn-g">Discover Artists →</Link>
          </div>
        </div>

        {featuredArtist && (
          <div className={styles.h1Tag}>
            <div className={styles.h1TagLbl}>Featured Artist</div>
            <div className={styles.h1TagName}>{featuredArtist.name}</div>
            <div className={styles.h1TagGenre}>
              {featuredArtist.genre} · {featuredArtist.location}
            </div>
            <div className={styles.h1TagLine} />
          </div>
        )}
      </section>

      {/* ── DESIGN 2 HERO ── */}
      <section className={styles.heroD2}>
        <div className={styles.h2Left}>
          <div className={styles.h2Badge}>Live from the underground</div>
          <h1 className={styles.h2Title}>
            Where <em>Sound</em><br />Becomes Art
          </h1>
          <p className={styles.h2Desc}>
            Your gateway to the beating pulse of the global music scene —
            curated events, emerging artists, and conversations that cut through
            the noise.
          </p>
          <div className={styles.h2Actions}>
            <Link href="/episodes" className="btn-p">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Latest Episodes
            </Link>
            <Link href="/artists" className="btn-g">Discover Artists</Link>
          </div>
          <div className={styles.h2Stats}>
            <div className={styles.h2Stat}>
              <div className={styles.num}>400K+</div>
              <div className={styles.lbl}>Listeners</div>
            </div>
            <div className={styles.h2Stat}>
              <div className={styles.num}>280+</div>
              <div className={styles.lbl}>Artists</div>
            </div>
            <div className={styles.h2Stat}>
              <div className={styles.num}>47</div>
              <div className={styles.lbl}>Episodes</div>
            </div>
          </div>
        </div>

        <div className={styles.h2Right}>
          <HeroSlideshow variant="panel" />
          {featuredArtist && (
            <div className={styles.h2Tag}>
              <div className={styles.h2TagPill}>Featured Artist</div>
              <div className={styles.h2TagName}>{featuredArtist.name}</div>
              <div className={styles.h2TagGenre}>
                {featuredArtist.genre} · {featuredArtist.location}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
