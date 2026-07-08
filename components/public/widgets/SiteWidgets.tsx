import WidgetRail from './WidgetRail'
import WidgetStack from './WidgetStack'
import { sortWidgetsLatestFirst, type PublicWidget } from '@/lib/widgetEmbed'

interface Props {
  widgets: PublicWidget[]
}

export default function SiteWidgets({ widgets }: Props) {
  if (!widgets.length) return null

  const sorted = sortWidgetsLatestFirst(widgets)
  const leftWidgets = sorted.filter(w => w.position === 'LEFT')
  const rightWidgets = sorted.filter(w => w.position === 'RIGHT')

  return (
    <>
      {leftWidgets.length > 0 && (
        <WidgetRail widgets={leftWidgets} position="LEFT" />
      )}
      {rightWidgets.length > 0 && (
        <WidgetRail widgets={rightWidgets} position="RIGHT" />
      )}
      <WidgetStack widgets={sorted} />
    </>
  )
}
