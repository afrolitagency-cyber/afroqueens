// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isMediaFolder, recordMediaAsset } from '@/lib/mediaAssets'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folderRaw = (formData.get('folder') as string) ?? 'blog'
  const alt = (formData.get('alt') as string | null)?.trim() || null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!isMediaFolder(folderRaw)) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploaded = await uploadToCloudinary(buffer, folderRaw)

    const asset = await recordMediaAsset({
      url: uploaded.url,
      publicId: uploaded.publicId,
      folder: folderRaw,
      filename: file.name || uploaded.publicId.split('/').pop() || null,
      alt,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      bytes: uploaded.bytes ?? null,
      mimeType: file.type || (uploaded.format ? `image/${uploaded.format}` : null),
      uploadedBy: session.user?.email ?? session.user?.id ?? null,
    })

    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
      assetId: asset.id,
    })
  } catch (err: unknown) {
    console.error('Cloudinary upload error:', err)
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
