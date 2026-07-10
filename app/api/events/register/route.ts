// app/api/events/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { upsertSubscriber } from '@/lib/newsletter'
import { sendEventRegistrationEmail } from '@/lib/newsletterConfirm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const name = body.name ? String(body.name).trim() : ''
    const eventId = String(body.eventId || '').trim()
    const eventSlug = String(body.eventSlug || '').trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 })
    }
    if (!eventId && !eventSlug) {
      return NextResponse.json({ error: 'Event is required.' }, { status: 400 })
    }

    const event = await prisma.event.findFirst({
      where: {
        published: true,
        ...(eventId ? { id: eventId } : { slug: eventSlug }),
      },
      include: { tag: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    const tagNames = event.tag?.name ? [event.tag.name] : undefined

    const sub = await upsertSubscriber({
      email,
      name: name || null,
      source: 'event_register',
      tagNames,
      confirmNow: true,
    })

    if (!sub.active) {
      return NextResponse.json(
        { error: 'This email is unsubscribed. Contact us to rejoin.' },
        { status: 409 },
      )
    }

    await prisma.eventRegistration.upsert({
      where: {
        eventId_subscriberId: {
          eventId: event.id,
          subscriberId: sub.id,
        },
      },
      create: {
        eventId: event.id,
        subscriberId: sub.id,
      },
      update: {},
    })

    let emailSent = false
    if (sub.unsubToken) {
      try {
        await sendEventRegistrationEmail({
          email: sub.email,
          name: sub.name,
          unsubToken: sub.unsubToken,
          eventTitle: event.title,
          eventSlug: event.slug,
          startsAt: event.startsAt,
          location: event.location,
          confirmEmailSubject: event.confirmEmailSubject,
          confirmEmailBody: event.confirmEmailBody,
        })
        emailSent = true
      } catch (e) {
        console.error('[events] registration email failed:', e)
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent,
      message: emailSent
        ? 'You are registered. Check your email for the details.'
        : 'You are registered. We could not send the confirmation email right now — save the event details from this page.',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
