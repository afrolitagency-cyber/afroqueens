import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { subject, schedule } = body

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }

  if (schedule === 'later') {
    return NextResponse.json(
      { error: 'Scheduled sending is not configured yet. Use Send Now or connect an email provider.' },
      { status: 501 },
    )
  }

  // Email delivery (Resend, SendGrid, etc.) is not wired up yet.
  // The compose UI is ready — add RESEND_API_KEY or similar to enable actual sends.
  return NextResponse.json(
    {
      message: 'Newsletter saved. Connect an email provider (e.g. Resend) in .env to enable sending.',
      sent: false,
    },
    { status: 200 },
  )
}
