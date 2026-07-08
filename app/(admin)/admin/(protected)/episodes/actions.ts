'use server'
// app/(admin)/admin/episodes/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EpisodeCategory } from '@prisma/client'
import { deleteMediaIfReplaced, deleteMediaUrls } from '@/lib/media'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
}

interface EpisodePayload {
  number: number
  title: string
  subtitle?: string
  description?: string
  duration: string
  releaseDate: Date
  category: EpisodeCategory
  audioUrl?: string
  coverImageUrl?: string
  featured: boolean
}

export async function createEpisode(data: EpisodePayload): Promise<ActionResult> {
  await requireAuth()

  if (!data.title?.trim()) return actionErr('Title is required.')
  if (!data.duration?.trim()) return actionErr('Duration is required.')
  if (Number.isNaN(data.number)) return actionErr('Episode number is required.')

  try {
    await withDbRetry(() => prisma.episode.create({ data }))
    revalidatePath('/episodes')
    revalidatePath('/')
    revalidatePath('/admin/episodes')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateEpisode(id: string, data: EpisodePayload): Promise<ActionResult> {
  await requireAuth()

  const existing = await prisma.episode.findUnique({
    where: { id },
    select: { audioUrl: true, coverImageUrl: true },
  })

  try {
    await withDbRetry(() => prisma.episode.update({ where: { id }, data }))
    await deleteMediaIfReplaced(existing?.coverImageUrl, data.coverImageUrl)
    await deleteMediaIfReplaced(existing?.audioUrl, data.audioUrl)
    revalidatePath('/episodes')
    revalidatePath('/')
    revalidatePath('/admin/episodes')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteEpisode(id: string): Promise<ActionResult> {
  await requireAuth()
  try {
    const episode = await prisma.episode.findUnique({
      where: { id },
      select: { audioUrl: true, coverImageUrl: true },
    })
    await withDbRetry(() => prisma.episode.delete({ where: { id } }))
    await deleteMediaUrls([episode?.coverImageUrl, episode?.audioUrl])
    revalidatePath('/episodes')
    revalidatePath('/')
    revalidatePath('/admin/episodes')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
