// app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteMediaAssetById } from '@/lib/mediaAssets'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (session.user.role === 'ARTIST') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

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
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  const result = await deleteMediaAssetById(params.id)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
