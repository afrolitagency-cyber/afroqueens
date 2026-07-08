'use client'
// app/(public)/search/SearchResults.tsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './search.module.css'

interface Post    { title: string; slug: string; excerpt: string | null; coverImageUrl: string | null; category: string | null; publishedAt: string | null }
interface Artist  { name: string; slug: string; genre: string | null; profileImageUrl: string | null }
interface Episode { id: string; title: string; subtitle: string | null; description: string | null; coverImageUrl: string | null }

interface Results { posts: Post[]; artists: Artist[]; episodes: Episode[] }

export default function SearchResults() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialQ     = searchParams.get('q') ?? ''

  const [query,   setQuery]   = useState(initialQ)
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data)
    setLoading(false)
  }, [])

  useEffect(() => { if (initialQ) search(initialQ) }, [initialQ, search])

  const handleInput = (val: string) => {
    setQuery(val)
    router.replace(`/search?q=${encodeURIComponent(val)}`, { scroll: false })
    search(val)
  }

  const total = results
    ? results.posts.length + results.artists.length + results.episodes.length
    : 0

  return (
    <main style={{ paddingTop: '110px', minHeight: '80vh' }}>
      <div className={`si ${styles.inner}`}>
        <div className="sl">Search</div>
        <h1 className={`st ${styles.title}`}>Find <em>Anything</em></h1>

        {/* Search input */}
        <div className={styles.inputWrap}>
          <span className={styles.icon}>⌕</span>
          <input
            className={styles.input}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder="Search artists, episodes, articles…"
            autoFocus
          />
          {query && (
            <button className={styles.clear} onClick={() => handleInput('')}>✕</button>
          )}
        </div>

        {/* States */}
        {!query && (
          <p className={styles.hint}>Start typing to search across the whole platform.</p>
        )}

        {loading && <p className={styles.hint}>Searching…</p>}

        {results && !loading && total === 0 && (
          <p className={styles.hint}>No results for "<strong>{query}</strong>". Try different keywords.</p>
        )}

        {results && !loading && total > 0 && (
          <div className={styles.results}>

            {/* Blog Posts */}
            {results.posts.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Articles</div>
                <div className={styles.postGrid}>
                  {results.posts.map(p => (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className={styles.postCard}>
                      {p.coverImageUrl && (
                        <div className={styles.postImg} style={{ backgroundImage: `url(${p.coverImageUrl})` }} />
                      )}
                      <div className={styles.postInfo}>
                        {p.category && <span className={styles.cat}>{p.category}</span>}
                        <div className={styles.postTitle}>{p.title}</div>
                        {p.excerpt && <p className={styles.postExcerpt}>{p.excerpt}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Artists */}
            {results.artists.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Artists</div>
                <div className={styles.artistGrid}>
                  {results.artists.map(a => (
                    <Link key={a.slug} href={`/artists/${a.slug}`} className={styles.artistCard}>
                      <div
                        className={styles.artistImg}
                        style={{ backgroundImage: a.profileImageUrl ? `url(${a.profileImageUrl})` : undefined }}
                      >
                        {!a.profileImageUrl && (
                          <span className={styles.artistInitial}>{a.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={styles.artistName}>{a.name}</div>
                      {a.genre && <div className={styles.artistGenre}>{a.genre}</div>}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Episodes */}
            {results.episodes.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionLabel}>Episodes</div>
                <div className={styles.epList}>
                  {results.episodes.map(ep => (
                    <Link key={ep.id} href={`/episodes/${ep.id}`} className={styles.epRow}>
                      {ep.coverImageUrl && (
                        <div className={styles.epImg} style={{ backgroundImage: `url(${ep.coverImageUrl})` }} />
                      )}
                      <div className={styles.epInfo}>
                        <div className={styles.epTitle}>{ep.title}</div>
                        {ep.subtitle && <div className={styles.epHost}>{ep.subtitle}</div>}
                        {ep.description && <p className={styles.epDesc}>{ep.description.slice(0, 120)}…</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
