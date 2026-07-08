import { getEmbedSrc, getEmbedHeight, type PublicWidget } from '@/lib/widgetEmbed'
import styles from './WidgetCard.module.css'

export default function WidgetCard({ widget }: { widget: PublicWidget }) {
  const isYoutube = widget.type === 'YOUTUBE'
  const height = getEmbedHeight(widget.type)

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{widget.title}</h3>
      <div
        className={`${styles.embedWrap} ${isYoutube ? styles.embedWrapVideo : ''}`}
        style={isYoutube ? undefined : { height }}
      >
        <iframe
          src={getEmbedSrc(widget)}
          className={styles.embed}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={widget.title}
        />
      </div>
    </article>
  )
}
