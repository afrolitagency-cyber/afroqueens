import { prisma } from '@/lib/prisma'
import NewsletterComposer from './NewsletterComposer'

export const dynamic = 'force-dynamic'

export default async function NewsletterComposePage() {
  const activeCount = await prisma.newsletterSubscriber.count({ where: { active: true } })

  return <NewsletterComposer activeCount={activeCount} />
}
