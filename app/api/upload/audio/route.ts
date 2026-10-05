// app/api/upload/audio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadAudio } from '@/lib/supabase'
import { requireUploaderApi } from '@/lib/authz'
import { validateAudioFile } from '@/lib/uploadValidation'

const AUDIO_FOLDERS = ['artists', 'episodes'] as const
type AudioFolder = (typeof AUDIO_FOLDERS)[number]

export async function POST(req: NextRequest) {
  const auth = await requireUploaderApi()
  if (auth.response) return auth.response

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const folderRaw = (formData.get('folder') as string | null) ?? 'artists'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }
  if (!(AUDIO_FOLDERS as readonly string[]).includes(folderRaw)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }
  const folder = folderRaw as AudioFolder
  if (!auth.isStaff && folder !== 'artists') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const invalid = validateAudioFile(file, buffer)
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 })
    }
    const url = await uploadAudio(buffer, file.name, folder)
    return NextResponse.json({ url })
  } catch (err: any) {
    console.error('Supabase audio upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
