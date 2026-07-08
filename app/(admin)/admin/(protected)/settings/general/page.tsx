// app/(admin)/admin/settings/general/page.tsx
import { prisma } from '@/lib/prisma'
import GeneralSettingsForm from './GeneralSettingsForm'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export default async function GeneralSettingsPage() {
  const settings = await prisma.siteSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>General Settings</div>
          <div className={styles.sub}>Site identity, contact info, and social links</div>
        </div>
      </div>
      <GeneralSettingsForm settings={settings} />
    </div>
  )
}
