'use server'
// app/(admin)/admin/gallery/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GalleryCategory, GalleryItem } from '@prisma/client'
import { deleteMediaUrl } from '@/lib/media'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/admin/login')
}

export async function createGalleryItem(data: {
  label: string
  category: GalleryCategory
  imageUrl: string
  featured: boolean
  order: number
}): Promise<ActionResult<GalleryItem>> {
  await requireAuth()
  try {
    const item = await withDbRetry(() => prisma.galleryItem.create({ data }))
    revalidatePath('/gallery')
    revalidatePath('/')
    revalidatePath('/admin/gallery')
    return actionOk(item)
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function updateGalleryItem(
  id: string,
  data: Partial<{ label: string; category: GalleryCategory; featured: boolean; order: number }>,
): Promise<ActionResult<GalleryItem>> {
  await requireAuth()
  try {
    const item = await withDbRetry(() => prisma.galleryItem.update({ where: { id }, data }))
    revalidatePath('/gallery')
    revalidatePath('/')
    revalidatePath('/admin/gallery')
    return actionOk(item)
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteGalleryItem(id: string): Promise<ActionResult> {
  await requireAuth()
  try {
    const item = await prisma.galleryItem.findUnique({
      where: { id },
      select: { imageUrl: true },
    })
    await withDbRetry(() => prisma.galleryItem.delete({ where: { id } }))
    await deleteMediaUrl(item?.imageUrl)
    revalidatePath('/gallery')
    revalidatePath('/')
    revalidatePath('/admin/gallery')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
