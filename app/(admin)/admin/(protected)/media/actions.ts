'use server'
// app/(admin)/admin/(protected)/media/actions.ts
import { requireStaff } from '@/lib/authz'
import { revalidatePath } from 'next/cache'
import { actionErr, actionOk, type ActionResult } from '@/lib/actions'
import { backfillMediaLibrary, deleteMediaAssetById } from '@/lib/mediaAssets'
import { prisma } from '@/lib/prisma'
import { dbErrorMessage } from '@/lib/dbRetry'

export async function updateMediaDetails(
  id: string,
  data: { title?: string; alt?: string; caption?: string },
): Promise<ActionResult> {
  await requireStaff()
  try {
    await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() || null } : {}),
        ...(data.alt !== undefined ? { alt: data.alt.trim() || null } : {}),
        ...(data.caption !== undefined ? { caption: data.caption.trim() || null } : {}),
      },
    })
    revalidatePath('/admin/media')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  await requireStaff()
  const result = await deleteMediaAssetById(id)
  if (!result.ok) return actionErr(result.error)
  revalidatePath('/admin/media')
  return actionOk()
}

export async function syncMediaFromContent(): Promise<
  ActionResult<{ created: number; skipped: number; titled: number }>
> {
  await requireStaff()
  try {
    const result = await backfillMediaLibrary()
    revalidatePath('/admin/media')
    return actionOk(result)
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
