'use server'
// app/(admin)/admin/comments/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/authz'

export async function approveComment(id: string) {
  await requireStaff()
  await prisma.comment.update({ where: { id }, data: { status: 'APPROVED' } })
  revalidatePath('/blog/[slug]', 'page')
}

export async function rejectComment(id: string) {
  await requireStaff()
  await prisma.comment.update({ where: { id }, data: { status: 'REJECTED' } })
}

export async function deleteComment(id: string) {
  await requireStaff()
  await prisma.comment.delete({ where: { id } })
  revalidatePath('/blog/[slug]', 'page')
}
