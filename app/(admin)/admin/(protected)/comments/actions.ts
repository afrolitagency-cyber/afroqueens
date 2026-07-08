'use server'
// app/(admin)/admin/comments/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
}

export async function approveComment(id: string) {
  await guard()
  await prisma.comment.update({ where: { id }, data: { status: 'APPROVED' } })
  revalidatePath('/blog/[slug]', 'page')
}

export async function rejectComment(id: string) {
  await guard()
  await prisma.comment.update({ where: { id }, data: { status: 'REJECTED' } })
}

export async function deleteComment(id: string) {
  await guard()
  await prisma.comment.delete({ where: { id } })
  revalidatePath('/blog/[slug]', 'page')
}
