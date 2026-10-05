'use server'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/authz'

export async function markRead(id: string) {
  await requireStaff()
  await prisma.contactSubmission.update({ where: { id }, data: { read: true } })
}

export async function deleteSubmission(id: string) {
  await requireStaff()
  await prisma.contactSubmission.delete({ where: { id } })
}
