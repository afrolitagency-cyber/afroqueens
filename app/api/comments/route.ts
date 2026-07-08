// app/api/comments/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { postId, name, email, body } = await req.json()
    if (!postId || !name || !email || !body)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await prisma.comment.create({
      data: { postId, name, email, body, status: 'PENDING' },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
