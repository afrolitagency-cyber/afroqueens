// app/(public)/episodes/page.tsx
import { prisma } from '@/lib/prisma'
import EpisodeList from '@/components/public/episodes/EpisodeList'
import styles from './episodes.module.css'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Episodes — Afroqueens FM',
  description: 'Deep conversations with artists, producers, and thinkers shaping the sound of a continent.',
  slug: 'episodes',
})

export const revalidate = 60

export default async function EpisodesPage() {
  const episodes = await prisma.episode.findMany({
    orderBy: { number: 'desc' },
  })

  const featured = episodes.find(e => e.featured) ?? episodes[0]
  const rest     = episodes.filter(e => e.id !== featured?.id)

  return (
    <main style={{ paddingTop: '100px' }}>
      <div className={styles.pageHero}>
        <div className={`si ${styles.heroInner}`}>
          <div className="sl">The Podcast</div>
          <h1 className="st">The <em>Frequency</em></h1>
          <p className={styles.heroDesc}>
            Deep conversations with the artists, producers, and thinkers
            shaping the sound of a continent.
          </p>
        </div>
      </div>

      <div className="si" style={{ padding: '5rem 4rem' }}>
        {/* Featured episode */}
        {featured && (
          <div className={styles.featEp}>
            <div className={styles.featLeft}>
              <div className={styles.featLabel}>Latest Episode · #{featured.number}</div>
              <h2 className={styles.featTitle}>{featured.title}</h2>
              {featured.description && (
                <p className={styles.featDesc}>{featured.description}</p>
              )}
              <div className={styles.featMeta}>
                <div className={styles.metaItem}>
                  Duration
                  <span>{featured.duration}</span>
                </div>
                <div className={styles.metaItem}>
                  Released
                  <span>
                    {featured.releaseDate.toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  Category
                  <span>{featured.category.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className={styles.featActions}>
                {featured.audioUrl ? (
                  <audio controls src={featured.audioUrl} className={styles.audioPlayer} />
                ) : (
                  <button className="btn-p">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Play Episode
                  </button>
                )}
                <a
                  href="https://open.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-g"
                >
                  Subscribe →
                </a>
              </div>
            </div>
            <div className={styles.featRight}>
              {/* Spinning vinyl record */}
              <div className={styles.vinyl} />
            </div>
          </div>
        )}

        {/* Episode filters + list */}
        <EpisodeList episodes={rest} />
      </div>
    </main>
  )
}
