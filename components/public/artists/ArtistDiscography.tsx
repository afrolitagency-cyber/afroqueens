'use client'

import { useMemo, useState } from 'react'
import styles from './ArtistDiscography.module.css'

type ReleaseType = 'ALBUM' | 'EP' | 'SINGLE'
type Filter = 'ALL' | ReleaseType

interface Track {
  id: string
  number: number
  title: string
  featuredArtists: string | null
  duration: string | null
  explicit: boolean
  listenUrl: string | null
}

export interface PublicRelease {
  id: string
  title: string
  type: ReleaseType
  year: number
  label: string | null
  description: string | null
  coverUrl: string | null
  listenUrl: string | null
  tracks: Track[]
}

interface Props {
  artistName: string
  releases: PublicRelease[]
}

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'ALBUM', label: 'Albums' },
  { value: 'EP', label: 'EPs' },
  { value: 'SINGLE', label: 'Singles' },
]

const TYPE_LABEL: Record<ReleaseType, string> = {
  ALBUM: 'Album',
  EP: 'EP',
  SINGLE: 'Single',
}

export default function ArtistDiscography({ artistName, releases }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)

  const filtered = useMemo(
    () => filter === 'ALL' ? releases : releases.filter(release => release.type === filter),
    [filter, releases],
  )
  const activeRelease = releases.find(release => release.id === activeId) ?? null

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setActiveId(null)
    setDescExpanded(false)
  }

  const toggleRelease = (id: string) => {
    setActiveId(current => {
      const next = current === id ? null : id
      setDescExpanded(false)
      return next
    })
  }

  const openListenUrl = (url: string | null) => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const description = activeRelease?.description?.trim() ?? ''
  const descriptionLong = description.length > 160
  const descriptionText =
    descriptionLong && !descExpanded
      ? `${description.slice(0, 160).trimEnd()}…`
      : description

  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.sectionLabel}>Discography</div>
          <h2 className={styles.sectionTitle}>Albums &amp; Singles</h2>
        </div>
        <span className={styles.sectionCount}>
          {releases.length} release{releases.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className={styles.filters} aria-label="Filter discography">
        {FILTERS.map(item => (
          <button
            key={item.value}
            type="button"
            className={`${styles.filter} ${filter === item.value ? styles.filterActive : ''}`}
            onClick={() => changeFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.map(release => (
          <button
            key={release.id}
            type="button"
            className={`${styles.card} ${activeId === release.id ? styles.cardActive : ''}`}
            onClick={() => toggleRelease(release.id)}
            aria-expanded={activeId === release.id}
          >
            <div className={styles.cover}>
              <div className={styles.coverInner}>
                {release.coverUrl ? (
                  <img src={release.coverUrl} alt={`${release.title} cover`} loading="lazy" />
                ) : (
                  <div className={styles.coverPlaceholder}>{artistName.charAt(0)}</div>
                )}
              </div>
              <span className={styles.playIcon}>▶</span>
              <span className={`${styles.typeBadge} ${styles[`badge${release.type}`]}`}>
                {TYPE_LABEL[release.type]}
              </span>
            </div>
            <div className={styles.releaseInfo}>
              <span className={styles.releaseTitle}>{release.title}</span>
              <span className={styles.releaseMeta}>
                <span>{release.year}</span>
                <span className={styles.separator}>·</span>
                <span>{release.tracks.length} track{release.tracks.length === 1 ? '' : 's'}</span>
              </span>
            </div>
          </button>
        ))}

        {activeRelease && (
          <div className={styles.detailPanel}>
            <div className={styles.detailInner}>
              <button
                type="button"
                className={styles.close}
                onClick={() => setActiveId(null)}
                aria-label="Close release details"
              >
                ✕
              </button>

              <div className={styles.detailSummary}>
                <div className={styles.detailCover}>
                  {activeRelease.coverUrl ? (
                    <img src={activeRelease.coverUrl} alt={`${activeRelease.title} cover`} />
                  ) : (
                    <div className={styles.detailCoverPlaceholder}>{artistName.charAt(0)}</div>
                  )}
                </div>

                <div className={styles.detailInfo}>
                  <div className={styles.detailType}>
                    {TYPE_LABEL[activeRelease.type]}
                  </div>
                  <h3 className={styles.detailTitle}>{activeRelease.title}</h3>
                  <div className={styles.detailArtist}>{artistName}</div>
                  <div className={styles.detailMeta}>
                    <span>{TYPE_LABEL[activeRelease.type]} · {activeRelease.year}</span>
                    {activeRelease.label && <span>{activeRelease.label}</span>}
                    <span>
                      {activeRelease.tracks.length} track{activeRelease.tracks.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {description && (
                    <div className={styles.detailDesc}>
                      <p>{descriptionText}</p>
                      {descriptionLong && (
                        <button
                          type="button"
                          className={styles.moreBtn}
                          onClick={() => setDescExpanded(current => !current)}
                        >
                          {descExpanded ? 'LESS' : 'MORE'}
                        </button>
                      )}
                    </div>
                  )}
                  {activeRelease.listenUrl && (
                    <button
                      type="button"
                      className={styles.playAll}
                      onClick={() => openListenUrl(activeRelease.listenUrl)}
                    >
                      ▶ Preview
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.tracks}>
                {activeRelease.tracks.map(track => {
                  const playable = Boolean(track.listenUrl || activeRelease.listenUrl)
                  return (
                    <button
                      key={track.id}
                      type="button"
                      className={styles.trackRow}
                      onClick={() => openListenUrl(track.listenUrl || activeRelease.listenUrl)}
                      disabled={!playable}
                    >
                      <span className={styles.trackNumber}>{track.number}</span>
                      <span className={styles.trackPlay}>▶</span>
                      <span className={styles.trackTitleWrap}>
                        <span className={styles.trackTitle}>{track.title}</span>
                        {track.featuredArtists && (
                          <span className={styles.trackFeature}>{track.featuredArtists}</span>
                        )}
                      </span>
                      {track.explicit ? <span className={styles.explicit}>E</span> : <span />}
                      <span className={styles.duration}>{track.duration ?? '—'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
