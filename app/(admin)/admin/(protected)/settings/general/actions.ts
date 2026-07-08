'use server'
// app/(admin)/admin/settings/general/actions.ts
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withDbRetry, dbErrorMessage } from '@/lib/dbRetry'
import type { ActionResult } from '@/lib/actions'
import { actionOk, actionErr } from '@/lib/actions'

export async function updateGeneralSettings(data: {
  siteName:        string
  siteDescription: string
  contactEmail:    string
  socialInstagram: string
  socialTwitter:   string
  socialYoutube:   string
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions)
  if (!session) return actionErr('Unauthorized')

  try {
    await withDbRetry(() =>
      prisma.siteSettings.upsert({
        where:  { id: 'singleton' },
        create: { id: 'singleton', ...data },
        update: data,
      }),
    )
    revalidatePath('/', 'layout')
    return actionOk()
  } catch (err) {
    return actionErr(dbErrorMessage(err))
  }
}
