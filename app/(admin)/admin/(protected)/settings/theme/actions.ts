'use server'
// app/(admin)/admin/settings/theme/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/authz'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

export async function updateSiteSettings({
  theme,
  design,
}: {
  theme: 'DARK' | 'LIGHT'
  design: 'ONE' | 'TWO'
}): Promise<ActionResult> {
  await requireStaff()

  try {
    await withDbRetry(() =>
      prisma.siteSettings.upsert({
        where:  { id: 'singleton' },
        create: { id: 'singleton', theme, design },
        update: { theme, design },
      }),
    )
    revalidatePath('/', 'layout')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
