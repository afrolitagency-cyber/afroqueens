'use client'
// app/(admin)/admin/settings/general/GeneralSettingsForm.tsx
import { useState, useTransition } from 'react'
import { updateGeneralSettings } from './actions'
import styles from '@/app/(admin)/admin/(protected)/shared.module.css'
import gs from './general.module.css'
import { SaveErrorBanner } from '@/components/admin/FormStatusBanners'

interface Props {
  settings: {
    siteName:        string
    siteDescription: string
    contactEmail:    string
    socialInstagram: string
    socialTwitter:   string
    socialYoutube:   string
  }
}

export default function GeneralSettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [siteName,        setSiteName]        = useState(settings.siteName)
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription)
  const [contactEmail,    setContactEmail]    = useState(settings.contactEmail)
  const [socialInstagram, setSocialInstagram] = useState(settings.socialInstagram)
  const [socialTwitter,   setSocialTwitter]   = useState(settings.socialTwitter)
  const [socialYoutube,   setSocialYoutube]   = useState(settings.socialYoutube)

  const save = () => {
    setSaveError(null)
    startTransition(async () => {
      const result = await updateGeneralSettings({
        siteName, siteDescription, contactEmail,
        socialInstagram, socialTwitter, socialYoutube,
      })
      if (!result.ok) {
        setSaveError(result.error)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className={gs.formWrap}>
      <SaveErrorBanner error={saveError} onRetry={save} retrying={isPending} />
      {/* ── Site Identity ── */}
      <section className={gs.section}>
        <h2 className={gs.sectionTitle}>Site Identity</h2>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Site Name</label>
          <input
            className={styles.input}
            value={siteName}
            onChange={e => setSiteName(e.target.value)}
            placeholder="Afroqueens FM"
          />
        </div>

        <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
          <label className={styles.label}>Site Description</label>
          <textarea
            className={styles.textarea}
            value={siteDescription}
            onChange={e => setSiteDescription(e.target.value)}
            rows={3}
            placeholder="Celebrating women in Afrobeats and African music culture."
          />
          <span className={gs.hint}>{siteDescription.length}/160 — used in SEO meta description</span>
        </div>

        <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
          <label className={styles.label}>Contact Email</label>
          <input
            className={styles.input}
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="hello@afroqueens.fm"
          />
        </div>
      </section>

      {/* ── Social Links ── */}
      <section className={gs.section}>
        <h2 className={gs.sectionTitle}>Social Links</h2>

        <div className={gs.socialGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Instagram URL</label>
            <input
              className={styles.input}
              value={socialInstagram}
              onChange={e => setSocialInstagram(e.target.value)}
              placeholder="https://instagram.com/afroqueensfm"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>X / Twitter URL</label>
            <input
              className={styles.input}
              value={socialTwitter}
              onChange={e => setSocialTwitter(e.target.value)}
              placeholder="https://x.com/afroqueensfm"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>YouTube URL</label>
            <input
              className={styles.input}
              value={socialYoutube}
              onChange={e => setSocialYoutube(e.target.value)}
              placeholder="https://youtube.com/@afroqueensfm"
            />
          </div>
        </div>
      </section>

      {/* ── Save bar ── */}
      <div className={gs.saveBar}>
        {saved && <span className={gs.savedMsg}>✓ Settings saved</span>}
        <button
          onClick={save}
          disabled={isPending}
          className={styles.saveBtn}
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
