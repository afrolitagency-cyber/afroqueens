// app/api/newsletter/subscribe/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
    if (existing) {
      if (existing.active) {
        return NextResponse.json({ error: 'You are already subscribed.' }, { status: 409 })
      }
      // Re-activate unsubscribed user
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { active: true, name: name || existing.name },
      })
      return NextResponse.json({ ok: true })
    }

    await prisma.newsletterSubscriber.create({ data: { email, name: name || null } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
