import { prisma } from '@/lib/prisma'
import SiteWidgets from './SiteWidgets'

export default async function PublicSiteWidgets() {
  const widgets = await prisma.widget.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })

  return <SiteWidgets widgets={widgets} />
}
