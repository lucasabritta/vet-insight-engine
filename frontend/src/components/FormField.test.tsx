import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FormField } from './FormField'

describe('FormField', () => {
  it('renders text input by default', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value="test value"
        onChange={handleChange}
      />
    )

    const input = screen.getByDisplayValue('test value') as HTMLInputElement
    expect(input.type).toBe('text')
    expect(screen.getByText('Test Input')).toBeInTheDocument()
  })

  it('renders textarea when isTextarea is true', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Textarea"
        value="test content"
        onChange={handleChange}
        isTextarea={true}
        rows={5}
      />
    )

    const textarea = screen.getByDisplayValue('test content') as HTMLTextAreaElement
    expect(textarea.tagName).toBe('TEXTAREA')
    expect(textarea.rows).toBe(5)
  })

  it('renders date input when type is date', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Date"
        value="2025-01-08"
        onChange={handleChange}
        type="date"
      />
    )

    const input = screen.getByDisplayValue('2025-01-08') as HTMLInputElement
    expect(input.type).toBe('date')
  })

  it('calls onChange when input value changes', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value="initial"
        onChange={handleChange}
      />
    )

    const input = screen.getByDisplayValue('initial')
    fireEvent.change(input, { target: { value: 'updated' } })

    expect(handleChange).toHaveBeenCalledWith('updated')
  })

  it('displays placeholder text when provided', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value=""
        onChange={handleChange}
        placeholder="Enter something"
      />
    )

    const input = screen.getByPlaceholderText('Enter something')
    expect(input).toBeInTheDocument()
  })

  it('displays error message when provided', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value="test"
        onChange={handleChange}
        error="This field is required"
      />
    )

    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('applies error styling to input when error is present', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value="test"
        onChange={handleChange}
        error="Error message"
      />
    )

    const input = screen.getByDisplayValue('test')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not show error styling when no error', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Input"
        value="test"
        onChange={handleChange}
      />
    )

    const input = screen.getByDisplayValue('test')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('textarea accepts multiple lines of text', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Test Textarea"
        value="line1"
        onChange={handleChange}
        isTextarea={true}
      />
    )

    const textarea = screen.getByDisplayValue('line1')
    fireEvent.change(textarea, { target: { value: 'line1\nline2\nline3' } })

    expect(handleChange).toHaveBeenCalledWith('line1\nline2\nline3')
  })

  it('renders label with proper accessibility', () => {
    const handleChange = vi.fn()
    render(
      <FormField
        label="Accessible Label"
        value=""
        onChange={handleChange}
      />
    )

    const label = screen.getByText('Accessible Label')
    expect(label.tagName).toBe('LABEL')
  })
})
