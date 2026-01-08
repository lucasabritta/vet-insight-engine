import { useState, useEffect } from 'react'

const AUTOSAVE_DELAY_MS = 2000
const SAVE_SUCCESS_TIMEOUT_MS = 3000

interface UseAutosaveProps {
  isDirty: boolean
  enabled: boolean
  onSave: () => Promise<void>
}

interface UseAutosaveReturn {
  isSaving: boolean
  isActive: boolean
  saveSuccess: boolean
  saveError: string | null
}

export function useAutosave({ isDirty, enabled, onSave }: UseAutosaveProps): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !isDirty) {
      setIsActive(false)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setIsActive(true)
        setIsSaving(true)
        await onSave()
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), SAVE_SUCCESS_TIMEOUT_MS)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Autosave failed')
        setIsActive(false)
      } finally {
        setIsSaving(false)
      }
    }, AUTOSAVE_DELAY_MS)

    return () => {
      clearTimeout(timeout)
      setIsActive(false)
    }
  }, [isDirty, enabled, onSave])

  return {
    isSaving,
    isActive,
    saveSuccess,
    saveError,
  }
}
