'use client'

import { useState } from 'react'
import WidgetCard from './WidgetCard'
import type { PublicWidget, WidgetPosition } from '@/lib/widgetEmbed'
import styles from './WidgetRail.module.css'

interface Props {
  widgets: PublicWidget[]
  position: WidgetPosition
}

export default function WidgetRail({ widgets, position }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (!widgets.length) return null

  const side = position.toLowerCase() as 'left' | 'right'

  return (
    <aside
      className={`${styles.rail} ${styles[side]} ${expanded ? styles.expanded : styles.collapsed}`}
      aria-label={`${position.toLowerCase()} widget rail`}
    >
      <div className={styles.stack}>
        {widgets.map(widget => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>

      <button
        type="button"
        className={styles.handle}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Collapse widget rail' : 'Expand widget rail'}
      >
        <span className={styles.handleIcon}>
          {expanded
            ? (position === 'RIGHT' ? '›' : '‹')
            : (position === 'RIGHT' ? '‹' : '›')}
        </span>
        {!expanded && (
          <span className={styles.handleLabel}>Widgets</span>
        )}
      </button>
    </aside>
  )
}
