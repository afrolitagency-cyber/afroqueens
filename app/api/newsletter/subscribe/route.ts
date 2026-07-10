// app/api/newsletter/subscribe/route.ts
import { NextResponse } from 'next/server'
import { upsertSubscriber } from '@/lib/newsletter'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const name = body.name ? String(body.name).trim() : null
    const source = (body.source === 'blog' ? 'blog' : 'footer') as 'footer' | 'blog'

    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 })

    const sub = await upsertSubscriber({
      email,
      name,
      source,
      confirmNow: true,
    })

    if (!sub.active) {
      return NextResponse.json({ error: 'You are unsubscribed. Contact us to rejoin.' }, { status: 409 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
