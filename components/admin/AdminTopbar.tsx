'use client'
// components/admin/AdminTopbar.tsx
import { useState, useTransition } from 'react'
import { updateSiteSettings } from '@/app/(admin)/admin/(protected)/settings/theme/actions'
import styles from './AdminTopbar.module.css'

interface Props {
  user?: { name?: string | null; email?: string | null } | null
  onMenuToggle?: () => void
  menuOpen?: boolean
}

export default function AdminTopbar({ user, onMenuToggle, menuOpen }: Props) {
  const [theme, setTheme] = useState<'DARK' | 'LIGHT'>('DARK')
  const [design, setDesign] = useState<'ONE' | 'TWO'>('ONE')
  const [isPending, startTransition] = useTransition()

  const apply = (newTheme: 'DARK' | 'LIGHT', newDesign: 'ONE' | 'TWO') => {
    const prevTheme = theme
    const prevDesign = design
    setTheme(newTheme)
    setDesign(newDesign)
    startTransition(async () => {
      const result = await updateSiteSettings({ theme: newTheme, design: newDesign })
      if (!result.ok) {
        setTheme(prevTheme)
        setDesign(prevDesign)
      }
    })
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button
          type="button"
          className={`${styles.menuBtn} ${menuOpen ? styles.menuBtnOpen : ''}`}
          onClick={onMenuToggle}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
        <span className={styles.greeting}>
          Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
        </span>
      </div>

      <div className={styles.right}>
        <div className={`${styles.switcherGroup} ${styles.hideOnNarrow}`}>
          <span className={styles.switchLabel}>Live Theme</span>
          <div className={styles.pills}>
            <button
              className={`${styles.pill} ${theme === 'DARK' ? styles.active : ''}`}
              onClick={() => apply('DARK', design)}
              disabled={isPending}
            >
              ◑ Dark
            </button>
            <button
              className={`${styles.pill} ${theme === 'LIGHT' ? styles.active : ''}`}
              onClick={() => apply('LIGHT', design)}
              disabled={isPending}
            >
              ◯ Light
            </button>
          </div>
        </div>

        <div className={`${styles.divider} ${styles.hideOnNarrow}`} />

        <div className={`${styles.switcherGroup} ${styles.hideOnNarrow}`}>
          <span className={styles.switchLabel}>Design</span>
          <div className={styles.pills}>
            <button
              className={`${styles.pill} ${design === 'ONE' ? styles.active : ''}`}
              onClick={() => apply(theme, 'ONE')}
              disabled={isPending}
            >
              D1
            </button>
            <button
              className={`${styles.pill} ${design === 'TWO' ? styles.active : ''}`}
              onClick={() => apply(theme, 'TWO')}
              disabled={isPending}
            >
              D2
            </button>
          </div>
        </div>

        {isPending && (
          <span className={styles.saving}>Saving…</span>
        )}

        <a
          href="/"
          target="_blank"
          rel="noopener"
          className={styles.viewSite}
        >
          <span className={styles.viewSiteFull}>View Site ↗</span>
          <span className={styles.viewSiteShort}>Site ↗</span>
        </a>
      </div>
    </header>
  )
}
