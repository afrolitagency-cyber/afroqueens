// components/public/nav/Ticker.tsx
import styles from './Ticker.module.css'

const ITEMS = [
  'Lagos Electronic Festival — Jun 12',
  'Afrofusion World Tour — Ongoing',
  'New Episode: The Frequency — Ep. 47',
  'Gallery: Port Harcourt Live Sessions',
  'Featured: Asa · Burna Boy · Rema · Siyanda K.',
]

export default function Ticker() {
  // Duplicate for seamless loop
  const items = [...ITEMS, ...ITEMS]

  return (
    <div className={styles.ticker}>
      <div className={styles.track}>
        {items.map((item, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.dot} />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
