'use client'
// components/public/gallery/GalleryGrid.tsx
import { useState } from 'react'
import styles from './GalleryGrid.module.css'

interface GalleryItem {
  id: string
  label: string
  category: string
  imageUrl: string
  cropPosition: 'TOP' | 'CENTER' | 'BOTTOM'
  featured: boolean
}

interface Props {
  items: GalleryItem[]
  categories: { value: string; label: string }[]
}

export default function GalleryGrid({ items, categories }: Props) {
  const [active, setActive] = useState('ALL')

  const bgPosition = (cropPosition: GalleryItem['cropPosition']) => {
    if (cropPosition === 'TOP') return 'center top'
    if (cropPosition === 'BOTTOM') return 'center bottom'
    return 'center'
  }

  const filtered = active === 'ALL'
    ? items
    : items.filter(i => i.category === active)

  return (
    <>
      {/* Filter bar */}
      <div className={styles.filterBar}>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setActive(cat.value)}
            className={`${styles.filterBtn} ${active === cat.value ? styles.activeFilter : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mosaic grid */}
      <div className={styles.mosaic}>
        {filtered.map((item, i) => (
          <div
            key={item.id}
            className={`${styles.item} ${i === 0 ? styles.large : ''}`}
          >
            <div
              className={styles.fill}
              style={{
                backgroundImage: `url(${item.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: bgPosition(item.cropPosition),
              }}
            />
            <div className={styles.overlay}>
              <div className={styles.icon}>+</div>
              <div className={styles.itemLabel}>{item.label}</div>
            </div>
            {item.featured && (
              <div className={styles.featTag}>Featured</div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
