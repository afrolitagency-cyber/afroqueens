'use server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function removeSubscriber(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
  await prisma.newsletterSubscriber.delete({ where: { id } })
}
