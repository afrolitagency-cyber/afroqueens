import WidgetCard from './WidgetCard'
import type { PublicWidget } from '@/lib/widgetEmbed'
import styles from './WidgetStack.module.css'

interface Props {
  widgets: PublicWidget[]
}

export default function WidgetStack({ widgets }: Props) {
  if (!widgets.length) return null

  return (
    <section className={styles.section} aria-label="Featured embeds">
      <div className={`si ${styles.inner}`}>
        <div className={styles.header}>
          <span className={styles.label}>Listen &amp; Watch</span>
        </div>
        <div className={styles.stack}>
          {widgets.map(widget => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </div>
      </div>
    </section>
  )
}
