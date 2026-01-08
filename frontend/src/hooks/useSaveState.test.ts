import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSaveState } from './useSaveState'

describe('useSaveState', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSaveState())

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveError).toBe(null)
    expect(result.current.saveSuccess).toBe(false)
    expect(result.current.showConfirmation).toBe(false)
  })

  it('sets isSaving when beginSave is called', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.isSaving).toBe(true)
    expect(result.current.saveError).toBe(null)
  })

  it('clears error when beginSave is called', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.failSave('Previous error')
    })

    expect(result.current.saveError).toBe('Previous error')

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.saveError).toBe(null)
    expect(result.current.isSaving).toBe(true)
  })

  it('sets saveSuccess and clears isSaving on completeSave', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.completeSave()
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveSuccess).toBe(true)
  })

  it('clears saveSuccess after SAVE_SUCCESS_TIMEOUT_MS', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.completeSave()
    })

    expect(result.current.saveSuccess).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.saveSuccess).toBe(false)
  })

  it('sets saveError and clears isSaving on failSave', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.failSave('Network error')
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveError).toBe('Network error')
  })

  it('allows manually setting saveError with setSaveError', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.setSaveError('Custom error')
    })

    expect(result.current.saveError).toBe('Custom error')

    act(() => {
      result.current.setSaveError(null)
    })

    expect(result.current.saveError).toBe(null)
  })

  it('allows manually setting saveSuccess with setSaveSuccess', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.setSaveSuccess(true)
    })

    expect(result.current.saveSuccess).toBe(true)

    act(() => {
      result.current.setSaveSuccess(false)
    })

    expect(result.current.saveSuccess).toBe(false)
  })

  it('shows confirmation dialog with setShowConfirmation', () => {
    const { result } = renderHook(() => useSaveState())

    expect(result.current.showConfirmation).toBe(false)

    act(() => {
      result.current.setShowConfirmation(true)
    })

    expect(result.current.showConfirmation).toBe(true)
  })

  it('hides confirmation dialog with resetConfirmation', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.setShowConfirmation(true)
    })

    expect(result.current.showConfirmation).toBe(true)

    act(() => {
      result.current.resetConfirmation()
    })

    expect(result.current.showConfirmation).toBe(false)
  })

  it('handles complete save flow', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.isSaving).toBe(true)
    expect(result.current.saveError).toBe(null)

    act(() => {
      result.current.completeSave()
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveSuccess).toBe(true)
  })

  it('handles failed save flow', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.failSave('Validation error')
    })

    expect(result.current.isSaving).toBe(false)
    expect(result.current.saveError).toBe('Validation error')
    expect(result.current.saveSuccess).toBe(false)
  })

  it('can recover from error state', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.failSave('Network error')
    })

    expect(result.current.saveError).toBe('Network error')

    act(() => {
      result.current.beginSave()
    })

    expect(result.current.saveError).toBe(null)
    expect(result.current.isSaving).toBe(true)
  })

  it('allows confirmation dialog independently from save state', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.setShowConfirmation(true)
      result.current.beginSave()
    })

    expect(result.current.showConfirmation).toBe(true)
    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.resetConfirmation()
    })

    expect(result.current.showConfirmation).toBe(false)
    expect(result.current.isSaving).toBe(true)
  })

  it('maintains separate states for error and success', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.setSaveSuccess(true)
    })

    expect(result.current.saveSuccess).toBe(true)
    expect(result.current.saveError).toBe(null)

    act(() => {
      result.current.setSaveError('Error occurred')
    })

    expect(result.current.saveError).toBe('Error occurred')
    expect(result.current.saveSuccess).toBe(true)
  })

  it('clears success message after timeout independently of other state', () => {
    const { result } = renderHook(() => useSaveState())

    act(() => {
      result.current.completeSave()
      result.current.setShowConfirmation(true)
    })

    expect(result.current.saveSuccess).toBe(true)
    expect(result.current.showConfirmation).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.saveSuccess).toBe(false)
    expect(result.current.showConfirmation).toBe(true)
  })
})
