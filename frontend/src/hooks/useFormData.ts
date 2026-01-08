import { useState, useCallback } from 'react'
import { getNestedValue, setNestedValue } from '../utils/nested-object'

const MAX_CHANGE_HISTORY = 20

export interface ChangeTrack {
  timestamp: Date
  field: string
  oldValue: unknown
  newValue: unknown
}

interface UseFormDataReturn {
  formData: Record<string, unknown>
  isDirty: boolean
  changeHistory: ChangeTrack[]
  getFormValue: (field: string) => string
  updateField: (field: string, value: string) => void
  updateNestedArray: (
    field: string,
    updater: (current: Array<Record<string, unknown>>) => Array<Record<string, unknown>>
  ) => void
  clearHistory: () => void
  resetDirty: () => void
}

export function useFormData(initialData: Record<string, unknown>): UseFormDataReturn {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData)
  const [baselineData, setBaselineData] = useState<Record<string, unknown>>(initialData)
  const [changeHistory, setChangeHistory] = useState<ChangeTrack[]>([])

  const isDirty = JSON.stringify(formData) !== JSON.stringify(baselineData)

  const trackChange = useCallback((field: string, oldValue: unknown, newValue: unknown) => {
    if (oldValue === newValue) return
    setChangeHistory((prev) => [
      { timestamp: new Date(), field, oldValue, newValue },
      ...prev.slice(0, MAX_CHANGE_HISTORY - 1),
    ])
  }, [])

  const getFormValue = useCallback(
    (field: string): string => {
      const value = getNestedValue(formData, field)
      return value === null || value === undefined ? '' : String(value)
    },
    [formData]
  )

  const updateField = useCallback(
    (field: string, value: string) => {
      const oldValue = getNestedValue(formData, field)
      trackChange(field, oldValue, value)
      setFormData((prev) => setNestedValue(prev, field, value))
    },
    [formData, trackChange]
  )

  const updateNestedArray = useCallback(
    (
      field: string,
      updater: (current: Array<Record<string, unknown>>) => Array<Record<string, unknown>>
    ) => {
      const current = (getNestedValue(formData, field) as Array<Record<string, unknown>>) || []
      const updated = updater(current)
      trackChange(field, current, updated)
      setFormData((prev) => setNestedValue(prev, field, updated))
    },
    [formData, trackChange]
  )

  const clearHistory = useCallback(() => {
    setChangeHistory([])
  }, [])
const resetDirty = useCallback(() => {
    setBaselineData(formData)
    setChangeHistory([])
  }, [formData])

  return {
    formData,
    isDirty,
    changeHistory,
    getFormValue,
    updateField,
    updateNestedArray,
    clearHistory,
    resetDirty,
  }
}
