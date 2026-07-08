'use client'
// app/(admin)/admin/settings/theme/ThemeSettingsForm.tsx
import { useState, useTransition } from 'react'
import { updateSiteSettings } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'
import ts from './theme.module.css'
import { SaveErrorBanner } from '@/components/admin/FormStatusBanners'

interface Props {
  settings: { theme: 'DARK' | 'LIGHT'; design: 'ONE' | 'TWO' }
}

export default function ThemeSettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [theme,  setTheme]  = useState<'DARK'|'LIGHT'>(settings.theme)
  const [design, setDesign] = useState<'ONE'|'TWO'>(settings.design)

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateSiteSettings({ theme, design })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className={ts.formWrap}>
      <SaveErrorBanner error={saveError} onRetry={save} retrying={isPending} />
      <section className={ts.section}>
        <h2 className={ts.sectionTitle}>Colour Scheme</h2>
        <div className={ts.optionGrid}>
          {(['DARK','LIGHT'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`${ts.optionCard} ${theme === t ? ts.optionActive : ''}`}
            >
              <span className={`${ts.swatch} ${t === 'DARK' ? ts.swatchDark : ts.swatchLight}`} />
              {t === 'DARK' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
      </section>

      <section className={ts.section}>
        <h2 className={ts.sectionTitle}>Layout Design</h2>
        <div className={ts.optionGrid}>
          {(['ONE','TWO'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDesign(d)}
              className={`${ts.optionCard} ${design === d ? ts.optionActive : ''}`}
            >
              Design {d === 'ONE' ? '1' : '2'}
            </button>
          ))}
        </div>
      </section>

      <div className={ts.saveBar}>
        {saved && <span className={ts.savedMsg}>✓ Theme updated</span>}
        <button onClick={save} disabled={isPending} className={styles.saveBtn}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
