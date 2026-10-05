// app/api/admin/blogs/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireStaffApi } from '@/lib/authz'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireStaffApi()
  if (auth.response) return auth.response

  const post = await prisma.blogPost.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}
