// app/api/upload/audio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadAudio } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const folder   = (formData.get('folder') as 'artists' | 'episodes') ?? 'artists'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  if (!file.type.startsWith('audio/')) {
    return NextResponse.json({ error: 'File must be audio' }, { status: 400 })
  }

  // 50MB max
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadAudio(buffer, file.name, folder)
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Supabase audio upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
