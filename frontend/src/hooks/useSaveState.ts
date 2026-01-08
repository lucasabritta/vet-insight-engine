import { useState, useCallback } from 'react'

interface UseSaveStateReturn {
  isSaving: boolean
  saveError: string | null
  saveSuccess: boolean
  showConfirmation: boolean
  setSaveError: (error: string | null) => void
  setSaveSuccess: (success: boolean) => void
  setShowConfirmation: (show: boolean) => void
  beginSave: () => void
  completeSave: () => void
  failSave: (error: string) => void
  resetConfirmation: () => void
}

export function useSaveState(): UseSaveStateReturn {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const beginSave = useCallback(() => {
    console.debug('save.begin')
    setSaveError(null)
    setIsSaving(true)
  }, [])

  const completeSave = useCallback(() => {
    console.debug('save.complete')
    setSaveSuccess(true)
    setIsSaving(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }, [])

  const failSave = useCallback((error: string) => {
    console.error('save.fail', { message: error })
    setSaveError(error)
    setIsSaving(false)
  }, [])

  const resetConfirmation = useCallback(() => {
    console.debug('save.confirmation.reset')
    setShowConfirmation(false)
  }, [])

  return {
    isSaving,
    saveError,
    saveSuccess,
    showConfirmation,
    setSaveError,
    setSaveSuccess,
    setShowConfirmation,
    beginSave,
    completeSave,
    failSave,
    resetConfirmation,
  }
}
