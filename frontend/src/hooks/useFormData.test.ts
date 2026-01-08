import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormData } from './useFormData'

describe('useFormData', () => {
  const mockInitialData = {
    petName: 'Fluffy',
    breed: 'Labrador',
    diagnoses: [
      { condition: 'Arthritis', date: '2025-01-01', severity: 'Mild', notes: 'Front leg' },
    ],
    medications: [
      { name: 'Aspirin', dosage: '100mg', route: 'Oral', indication: 'Pain' },
    ],
  }

  it('initializes with provided data', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    expect(result.current.formData).toEqual(mockInitialData)
    expect(result.current.isDirty).toBe(false)
  })

  it('tracks changes as dirty state', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    expect(result.current.isDirty).toBe(false)

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.isDirty).toBe(true)
  })

  it('updates top-level fields', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.formData.petName).toBe('Spot')
  })

  it('gets nested field values', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    const diagnosis = result.current.getFormValue('diagnoses.0.condition')
    expect(diagnosis).toBe('Arthritis')
  })

  it('returns empty string for non-existent nested paths', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    const value = result.current.getFormValue('nonexistent.path')
    expect(value).toBe('')
  })

  it('updates nested array items', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateNestedArray('diagnoses', (current) => {
        const updated = [...current]
        updated[0] = { ...updated[0], severity: 'Severe' }
        return updated
      })
    })

    expect((result.current.formData.diagnoses as Array<Record<string, unknown>>)[0].severity).toBe('Severe')
  })

  it('adds new items to nested array', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateNestedArray('diagnoses', (current) => [
        ...current,
        { condition: 'Diabetes', date: '2025-01-05', severity: 'Moderate', notes: 'New' },
      ])
    })

    expect(result.current.formData.diagnoses).toHaveLength(2)
    expect((result.current.formData.diagnoses as Array<Record<string, unknown>>)[1].condition).toBe('Diabetes')
  })

  it('removes items from nested array', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateNestedArray('diagnoses', (current) => current.filter((_, i) => i !== 0))
    })

    expect(result.current.formData.diagnoses).toHaveLength(0)
  })

  it('tracks change history', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.changeHistory).toHaveLength(1)
    expect(result.current.changeHistory[0].field).toBe('petName')
    expect(result.current.changeHistory[0].oldValue).toBe('Fluffy')
    expect(result.current.changeHistory[0].newValue).toBe('Spot')
  })

  it('limits change history to MAX_CHANGE_HISTORY', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.updateField('petName', `Name${i}`)
      }
    })

    expect(result.current.changeHistory.length).toBeLessThanOrEqual(20)
  })

  it('clears change history', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.changeHistory).toHaveLength(1)

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.changeHistory).toHaveLength(0)
  })

  it('does not mark as dirty when reverting to initial state', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.updateField('petName', 'Fluffy')
    })

    expect(result.current.isDirty).toBe(false)
  })

  it('handles multiple concurrent updates', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
      result.current.updateField('breed', 'Golden Retriever')
    })

    expect(result.current.formData.petName).toBe('Spot')
    expect(result.current.formData.breed).toBe('Golden Retriever')
  })

  it('preserves other fields when updating one field', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateField('petName', 'Spot')
    })

    expect(result.current.formData.breed).toBe('Labrador')
    expect(result.current.formData.diagnoses).toEqual(mockInitialData.diagnoses)
    expect(result.current.formData.medications).toEqual(mockInitialData.medications)
  })

  it('handles empty array operations', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateNestedArray('medications', () => [])
    })

    expect(result.current.formData.medications).toHaveLength(0)
  })

  it('supports nested updates with complex structures', () => {
    const { result } = renderHook(() => useFormData(mockInitialData))

    act(() => {
      result.current.updateNestedArray('diagnoses', (current) => {
        const updated = [...current]
        updated[0] = {
          ...updated[0],
          notes: 'Updated notes with more details',
        }
        return updated
      })
    })

    expect((result.current.formData.diagnoses as Array<Record<string, unknown>>)[0].notes).toBe('Updated notes with more details')
  })
})
