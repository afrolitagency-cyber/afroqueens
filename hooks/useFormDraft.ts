'use client'

import { useEffect, useRef, useState } from 'react'
import { loadFormDraft, saveFormDraft, clearFormDraft } from '@/lib/formDraft'

export function useFormDraft<T extends Record<string, unknown>>(
  key: string,
  data: T,
  onRestore: (draft: T) => void,
  enabled = true,
) {
  const [restored, setRestored] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const ready = useRef(false)

  useEffect(() => {
    if (!enabled) return
    const draft = loadFormDraft<T & { _savedAt?: string }>(key)
    if (draft) {
      const { _savedAt, ...rest } = draft
      onRestore(rest as T)
      setRestored(true)
      if (_savedAt) setSavedAt(_savedAt)
    }
    ready.current = true
    setLoaded(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  useEffect(() => {
    if (!enabled || !ready.current) return
    const timer = setTimeout(() => {
      saveFormDraft(key, data)
      setSavedAt(new Date().toISOString())
    }, 800)
    return () => clearTimeout(timer)
  }, [key, data, enabled])

  const clear = () => {
    clearFormDraft(key)
    setRestored(false)
    setSavedAt(null)
  }

  const persist = () => saveFormDraft(key, data)

  return { restored, setRestored, savedAt, clear, persist, loaded }
}
