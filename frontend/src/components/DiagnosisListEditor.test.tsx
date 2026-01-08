import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DiagnosisListEditor } from './DiagnosisListEditor'

describe('DiagnosisListEditor', () => {
  const mockDiagnoses = [
    { condition: 'Arthritis', date: '2025-01-01', severity: 'Moderate', notes: 'Front left leg' },
    { condition: 'Diabetes', date: '2024-12-15', severity: 'Mild', notes: 'Managed with diet' },
  ]

  it('renders diagnosis items from props', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getByDisplayValue('Arthritis')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Diabetes')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Moderate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Mild')).toBeInTheDocument()
  })

  it('renders empty list when no diagnoses provided', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={[]}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getByText('+ Add Diagnosis')).toBeInTheDocument()
  })

  it('calls onAdd when Add Diagnosis button is clicked', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={[]}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    fireEvent.click(screen.getByText('+ Add Diagnosis'))

    expect(handleAdd).toHaveBeenCalled()
  })

  it('calls onRemove with correct index when Remove button is clicked', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const removeButtons = screen.getAllByText('Remove')
    fireEvent.click(removeButtons[0])

    expect(handleRemove).toHaveBeenCalledWith(0)

    fireEvent.click(removeButtons[1])

    expect(handleRemove).toHaveBeenCalledWith(1)
  })

  it('calls onChange when diagnosis field is modified', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const conditionInput = screen.getByDisplayValue('Arthritis')
    fireEvent.change(conditionInput, { target: { value: 'Osteoarthritis' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'condition', 'Osteoarthritis')
  })

  it('displays error messages for diagnosis fields', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()
    const errors = {
      'diagnoses.0.condition': 'Condition is required',
      'diagnoses.1.severity': 'Severity must be specified',
    }

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={errors}
      />
    )

    expect(screen.getByText('Condition is required')).toBeInTheDocument()
    expect(screen.getByText('Severity must be specified')).toBeInTheDocument()
  })

  it('renders all field labels for each diagnosis', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getAllByText('Condition')).toHaveLength(2)
    expect(screen.getAllByText('Date of Diagnosis')).toHaveLength(2)
    expect(screen.getAllByText('Severity')).toHaveLength(2)
    expect(screen.getAllByText('Notes')).toHaveLength(2)
  })

  it('handles changing date field', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const dateInputs = screen.getAllByDisplayValue('2025-01-01')
    fireEvent.change(dateInputs[0], { target: { value: '2025-01-10' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'date', '2025-01-10')
  })

  it('handles changing notes textarea', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const notesField = screen.getByDisplayValue('Front left leg')
    fireEvent.change(notesField, { target: { value: 'Affecting mobility' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'notes', 'Affecting mobility')
  })

  it('renders with multiple remove buttons when multiple diagnoses exist', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <DiagnosisListEditor
        diagnoses={mockDiagnoses}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const removeButtons = screen.getAllByText('Remove')
    expect(removeButtons).toHaveLength(2)
  })
})
