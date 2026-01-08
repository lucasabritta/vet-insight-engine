import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAutosave } from './useAutosave'

describe('useAutosave', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('initializes with default state', () => {
    const mockOnSave = vi.fn()

    const { result } = renderHook(() =>
      useAutosave({
        isDirty: false,
        enabled: true,
        onSave: mockOnSave,
      })
    )

    expect(result.current.isSaving).toBe(false)
    expect(result.current.isActive).toBe(false)
    expect(result.current.saveSuccess).toBe(false)
  })

  it('does not save when disabled', () => {
    const mockOnSave = vi.fn()

    renderHook(() =>
      useAutosave({
        isDirty: true,
        enabled: false,
        onSave: mockOnSave,
      })
    )

    vi.advanceTimersByTime(2500)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('does not save when not dirty', () => {
    const mockOnSave = vi.fn()

    renderHook(() =>
      useAutosave({
        isDirty: false,
        enabled: true,
        onSave: mockOnSave,
      })
    )

    vi.advanceTimersByTime(2500)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('calls onSave after debounce period when dirty and enabled', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined)

    renderHook(() =>
      useAutosave({
        isDirty: true,
        enabled: true,
        onSave: mockOnSave,
      })
    )

    vi.advanceTimersByTime(1999)
    expect(mockOnSave).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mockOnSave).toHaveBeenCalledTimes(1)
  })

  it('debounces multiple changes', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ isDirty }) =>
        useAutosave({
          isDirty,
          enabled: true,
          onSave: mockOnSave,
        }),
      {
        initialProps: { isDirty: true },
      }
    )

    vi.advanceTimersByTime(500)
    rerender({ isDirty: true })

    vi.advanceTimersByTime(500)
    rerender({ isDirty: true })

    vi.advanceTimersByTime(500)
    rerender({ isDirty: true })

    expect(mockOnSave).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1500)

    expect(mockOnSave).toHaveBeenCalledTimes(1)
  })

  it('disables autosave when toggle disabled during debounce', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      ({ isDirty, enabled }) =>
        useAutosave({
          isDirty,
          enabled,
          onSave: mockOnSave,
        }),
      {
        initialProps: { isDirty: true, enabled: true },
      }
    )

    vi.advanceTimersByTime(1000)

    rerender({ isDirty: true, enabled: false })

    vi.advanceTimersByTime(2000)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('cleans up timers on unmount', () => {
    const mockOnSave = vi.fn()

    const { unmount } = renderHook(() =>
      useAutosave({
        isDirty: true,
        enabled: true,
        onSave: mockOnSave,
      })
    )

    unmount()

    vi.advanceTimersByTime(5000)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('respects AUTOSAVE_DELAY_MS constant', () => {
    const mockOnSave = vi.fn().mockResolvedValue(undefined)

    renderHook(() =>
      useAutosave({
        isDirty: true,
        enabled: true,
        onSave: mockOnSave,
      })
    )

    vi.advanceTimersByTime(1999)
    expect(mockOnSave).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mockOnSave).toHaveBeenCalled()
  })
})
