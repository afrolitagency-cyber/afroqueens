// app/(public)/about/page.tsx
import Link from 'next/link'
import styles from './about.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'About — Afroqueens FM',
  description: 'Afroqueens FM documents, amplifies, and celebrates women in African music — from Afrobeats to Highlife and beyond.',
  slug: 'about',
})

const VALUES = [
  {
    icon: '♪',
    title: 'Authenticity First',
    body: 'We never chase virality. Every piece of content we publish is grounded in genuine love for the music and deep respect for the artists behind it.',
  },
  {
    icon: '◎',
    title: 'Community Over Commerce',
    body: 'We are reader-supported and community-driven. We don\'t answer to advertisers — we answer to the artists and audiences who make this culture what it is.',
  },
  {
    icon: '✦',
    title: 'Women at the Centre',
    body: 'This is not a platform that occasionally features women. It is a platform built around them. The stories we tell, the artists we profile, the history we document — it centres women.',
  },
  {
    icon: '⊕',
    title: 'Pan-African Perspective',
    body: 'From Lagos to Accra to Johannesburg to Nairobi — we don\'t reduce African music to a single city or sound. We follow the continent, in all its richness.',
  },
  {
    icon: '◻',
    title: 'Editorial Independence',
    body: 'Our coverage is never bought. Artists are profiled on the strength of their work. Our editorial team makes every decision independently, without commercial influence.',
  },
  {
    icon: '▶',
    title: 'Archive for the Future',
    body: 'We are building a living archive. The interviews and profiles we publish today will be reference points for the historians and journalists of tomorrow.',
  },
]

const STATS = [
  { num: '280+', label: 'Artists Documented' },
  { num: '47', label: 'Podcast Episodes' },
  { num: '120K', label: 'Monthly Readers' },
  { num: '6yr', label: 'Years Running' },
]

const TEAM = [
  {
    initials: 'AO',
    name: 'Adaora Okafor',
    role: 'Founder & Editor-in-Chief',
    bio: 'Former music journalist at The Guardian Nigeria. Founded Afroqueens FM in 2019 after realising that the women making the music were constantly left out of the conversation about it.',
  },
  {
    initials: 'TN',
    name: 'Temi Nwosu',
    role: 'Senior Music Writer',
    bio: 'Covers Afrobeats, Electronic, and the intersection of fashion and sound. Based in Lagos. Has interviewed everyone from rising artists to Grammy winners.',
  },
  {
    initials: 'KA',
    name: 'Kofi Asante',
    role: 'Podcast Producer',
    bio: 'Audio engineer and producer behind every Afroqueens FM episode. Brings two decades of live recording experience to every conversation we publish.',
  },
]

export default function AboutPage() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className="si">
          <div className={styles.heroInner}>
            <div className="sl">Our Story</div>
            <h1 className={styles.heroTitle}>
              We Document<br /><em>African</em><br />Sound
            </h1>
            <span className="red-rule" />
            <p className={styles.heroBody}>
              Afroqueens FM was built on a simple conviction: the women shaping African music are among the most important artists alive, and the world deserves to know their names, their stories, and their sound.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.mission}>
        <div className="si">
          <div className={styles.missionGrid}>
            <div>
              <div className={styles.missionNum}>01</div>
              <h2 className={styles.missionTitle}>The <em>Mission</em></h2>
              <span className="red-rule" />
              <div className={styles.missionBody}>
                <p>We are an independent platform dedicated to the documentation, amplification, and celebration of women in Afrobeats, Highlife, Electronic, and across the full spectrum of African sound.</p>
                <p>Every artist profile, every episode, every cover story — it all serves one purpose: to ensure that the women who built this music are never footnotes in their own history.</p>
                <p>We are not a label. We are not a PR firm. We are journalists, music lovers, and believers in the power of intentional storytelling.</p>
              </div>
            </div>
            <div className={styles.missionVisual}>
              <span>Mission Visual</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.values}>
        <div className="si">
          <div className="sl">What We Stand For</div>
          <h2 className="st">Our <em>Values</em></h2>
          <div className={styles.valuesGrid}>
            {VALUES.map(v => (
              <div key={v.title} className={styles.valueCard}>
                <span className={styles.valueIcon}>{v.icon}</span>
                <div className={styles.valueTitle}>{v.title}</div>
                <p className={styles.valueBody}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className="si">
          <div className="sl">By the Numbers</div>
          <h2 className="st">The <em>Platform</em></h2>
          <div className={styles.statsRow}>
            {STATS.map(s => (
              <div key={s.label} className={styles.stat}>
                <div className={styles.statNum}>{s.num}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.team}>
        <div className="si">
          <div className="sl">The People</div>
          <h2 className="st">Who We <em>Are</em></h2>
          <div className={styles.teamGrid}>
            {TEAM.map(member => (
              <div key={member.name} className={styles.teamCard}>
                <div className={styles.teamImg}>
                  <div className={styles.teamImgPlaceholder}>{member.initials}</div>
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>{member.name}</div>
                  <div className={styles.teamRole}>{member.role}</div>
                  <p className={styles.teamBio}>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <div className="si">
          <div className="sl">Join Us</div>
          <h2 className="st">Be Part of the <em>Story</em></h2>
          <p className={styles.ctaText}>
            Whether you&apos;re an artist, a journalist, a music lover, or just someone who believes African women belong at the centre of African music — there&apos;s a place for you here.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/contact" className="btn-p">Get in Touch</Link>
            <Link href="/blog" className="btn-g">Read the Blog</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
