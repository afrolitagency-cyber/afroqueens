'use server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
}

export async function markRead(id: string) {
  await guard()
  await prisma.contactSubmission.update({ where: { id }, data: { read: true } })
}

export async function deleteSubmission(id: string) {
  await guard()
  await prisma.contactSubmission.delete({ where: { id } })
}
