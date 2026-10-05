// app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteMediaAssetById } from '@/lib/mediaAssets'
import { requireStaffApi } from '@/lib/authz'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  let body: { alt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const alt = typeof body.alt === 'string' ? body.alt.trim() || null : null
  const asset = await prisma.mediaAsset.update({
    where: { id: params.id },
    data: { alt },
  }).catch(() => null)

  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(asset)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  const result = await deleteMediaAssetById(params.id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
