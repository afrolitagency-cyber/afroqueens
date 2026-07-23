'use server'
// app/(admin)/admin/widgets/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
}

interface WidgetPayload {
  type: 'YOUTUBE' | 'SPOTIFY' | 'SOUNDCLOUD' | 'APPLE_MUSIC' | 'CUSTOM'
  title: string
  embedUrl: string
  position: 'LEFT' | 'RIGHT'
  active: boolean
  order: number
}

function revalidateWidgetPaths() {
  revalidatePath('/', 'layout')
  revalidatePath('/artists')
  revalidatePath('/episodes')
  revalidatePath('/blog')
  revalidatePath('/gallery')
  revalidatePath('/admin/widgets')
}

export async function createWidget(data: WidgetPayload): Promise<ActionResult> {
  await requireAuth()
  if (!data.title?.trim() || !data.embedUrl?.trim()) {
    return actionErr('Title and URL are required.')
  }
  try {
    await withDbRetry(() => prisma.widget.create({ data }))
    revalidateWidgetPaths()
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateWidget(id: string, data: WidgetPayload): Promise<ActionResult> {
  await requireAuth()
  try {
    await withDbRetry(() => prisma.widget.update({ where: { id }, data }))
    revalidateWidgetPaths()
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteWidget(id: string): Promise<void> {
  const result = await deleteWidgetSafe(id)
  if (!result.ok) throw new Error(result.error)
}

export async function deleteWidgetSafe(id: string): Promise<ActionResult> {
  await requireAuth()
  try {
    await withDbRetry(() => prisma.widget.delete({ where: { id } }))
    revalidateWidgetPaths()
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function toggleWidget(id: string, active: boolean): Promise<void> {
  const result = await toggleWidgetSafe(id, active)
  if (!result.ok) throw new Error(result.error)
}

export async function toggleWidgetSafe(id: string, active: boolean): Promise<ActionResult> {
  await requireAuth()
  try {
    await withDbRetry(() => prisma.widget.update({ where: { id }, data: { active } }))
    revalidateWidgetPaths()
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
