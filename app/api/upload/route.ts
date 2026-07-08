// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Auth check — only admin can upload
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const folder   = (formData.get('folder') as string) ?? 'blog'

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const validFolders = ['artists', 'blog', 'gallery', 'episodes']
  if (!validFolders.includes(folder)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, publicId } = await uploadToCloudinary(
      buffer,
      folder as any
    )

    return NextResponse.json({ url, publicId })
  } catch (err: any) {
    console.error('Cloudinary upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
