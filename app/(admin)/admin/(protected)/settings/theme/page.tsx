// app/(admin)/admin/settings/theme/page.tsx
import { prisma } from '@/lib/prisma'
import ThemeSettingsForm from './ThemeSettingsForm'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

export default async function ThemeSettingsPage() {
  const settings = await prisma.siteSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Theme Settings</div>
          <div className={styles.sub}>Control the look and feel of the public site</div>
        </div>
      </div>
      <ThemeSettingsForm settings={settings} />
    </div>
  )
}
