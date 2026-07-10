// app/api/newsletter/unsubscribe/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

async function deactivateByToken(token: string) {
  return prisma.newsletterSubscriber.updateMany({
    where: { unsubToken: token },
    data: { active: false },
  })
}

async function deactivateByEmail(email: string) {
  return prisma.newsletterSubscriber.updateMany({
    where: { email: email.toLowerCase() },
    data: { active: false },
  })
}

function unsubHtml(message: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:60px auto;padding:0 20px;color:#222;">
  <h1 style="font-size:1.4rem;">You're unsubscribed</h1>
  <p>${message}</p>
  <p><a href="/" style="color:#C8102E;">Back to Afroqueens</a></p>
</body></html>`
}

/** One-click unsubscribe from email footer links */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')?.trim()
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (token) {
      const result = await deactivateByToken(token)
      if (result.count === 0) {
        return new NextResponse('Invalid unsubscribe link.', { status: 404 })
      }
      return new NextResponse(unsubHtml('You will no longer receive Afroqueens newsletters.'), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (email) {
      await deactivateByEmail(email)
      return new NextResponse(unsubHtml(`${email} will no longer receive Afroqueens newsletters.`), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    return new NextResponse('Email or token is required.', { status: 400 })
  } catch {
    return new NextResponse('Could not unsubscribe. Please try again.', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const token = body.token?.trim()
    const email = body.email ? String(body.email).trim().toLowerCase() : null
    if (token) await deactivateByToken(token)
    else if (email) await deactivateByEmail(email)
    else return NextResponse.json({ error: 'Token or email required.' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
