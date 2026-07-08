// app/api/newsletter/unsubscribe/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 })
    await prisma.newsletterSubscriber.updateMany({
      where: { email },
      data: { active: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
