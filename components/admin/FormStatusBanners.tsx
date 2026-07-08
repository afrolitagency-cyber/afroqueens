'use client'

import styles from '@/app/(admin)/admin/(protected)/shared.module.css'

interface DraftBannerProps {
  show: boolean
  onDismiss: () => void
  onClear?: () => void
  message?: string
}

export function DraftBanner({
  show,
  onDismiss,
  onClear,
  message = 'Draft restored — your previous work is back.',
}: DraftBannerProps) {
  if (!show) return null
  return (
    <div className={styles.draftBanner}>
      <span>{message}</span>
      <button type="button" className={styles.draftDismiss} onClick={onDismiss}>
        Dismiss
      </button>
      {onClear && (
        <button type="button" className={styles.draftClear} onClick={onClear}>
          Clear draft
        </button>
      )}
    </div>
  )
}

interface SaveErrorBannerProps {
  error: string | null
  onRetry?: () => void
  retrying?: boolean
}

export function SaveErrorBanner({ error, onRetry, retrying }: SaveErrorBannerProps) {
  if (!error) return null
  return (
    <div className={styles.errorBanner}>
      <strong>Could not save.</strong> {error}
      {onRetry && (
        <button
          type="button"
          className={styles.retryBtn}
          onClick={onRetry}
          disabled={retrying}
        >
          Retry save
        </button>
      )}
    </div>
  )
}

interface DraftHintProps {
  savedAt: string | null
  hidden?: boolean
}

export function DraftHint({ savedAt, hidden }: DraftHintProps) {
  if (!savedAt || hidden) return null
  return (
    <p className={styles.draftHint}>
      Draft saved locally · {new Date(savedAt).toLocaleTimeString()}
    </p>
  )
}
