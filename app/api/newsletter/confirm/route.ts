// app/api/newsletter/confirm/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get('token')?.trim()
    if (!token) {
      return new NextResponse('Invalid confirmation link.', { status: 400 })
    }

    const updated = await prisma.newsletterSubscriber.updateMany({
      where: { unsubToken: token, active: true },
      data: { confirmedAt: new Date() },
    })

    if (updated.count === 0) {
      return new NextResponse('This confirmation link is invalid or expired.', { status: 404 })
    }

    return new NextResponse(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Confirmed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#222;">
  <h1 style="font-size:1.4rem;">You're confirmed!</h1>
  <p>Thanks — you'll receive Afroqueens newsletter updates from now on.</p>
  <p><a href="/" style="color:#C8102E;">Back to Afroqueens</a></p>
</body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  } catch {
    return new NextResponse('Could not confirm subscription.', { status: 500 })
  }
}
