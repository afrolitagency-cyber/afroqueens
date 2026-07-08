// app/api/admin/widgets/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const widget = await prisma.widget.findUnique({ where: { id: params.id } })
  if (!widget) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(widget)
}
