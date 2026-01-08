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
    setSaveError(null)
    setIsSaving(true)
  }, [])

  const completeSave = useCallback(() => {
    setSaveSuccess(true)
    setIsSaving(false)
    setTimeout(() => setSaveSuccess(false), 3000)
  }, [])

  const failSave = useCallback((error: string) => {
    setSaveError(error)
    setIsSaving(false)
  }, [])

  const resetConfirmation = useCallback(() => {
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
