import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EventForm from '../../EventForm'

export const dynamic = 'force-dynamic'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: { tag: true },
  })
  if (!event) notFound()

  return (
    <EventForm
      mode="edit"
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        published: event.published,
        tagName: event.tag?.name ?? null,
        confirmEmailSubject: event.confirmEmailSubject,
        confirmEmailBody: event.confirmEmailBody,
      }}
    />
  )
}
