import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MedicationListEditor } from './MedicationListEditor'

describe('MedicationListEditor', () => {
  const mockMedications = [
    { name: 'Carprofen', dosage: '100mg twice daily', route: 'Oral', indication: 'Pain relief' },
    { name: 'Amoxicillin', dosage: '500mg twice daily', route: 'Oral', indication: 'Infection' },
  ]

  it('renders medication items from props', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getByDisplayValue('Carprofen')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Amoxicillin')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100mg twice daily')).toBeInTheDocument()
    expect(screen.getAllByDisplayValue('Oral')).toHaveLength(2)
  })

  it('renders empty list when no medications provided', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={[]}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getByText('+ Add Medication')).toBeInTheDocument()
  })

  it('calls onAdd when Add Medication button is clicked', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={[]}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    fireEvent.click(screen.getByText('+ Add Medication'))

    expect(handleAdd).toHaveBeenCalled()
  })

  it('calls onRemove with correct index when Remove button is clicked', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
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

  it('calls onChange when medication field is modified', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const nameInput = screen.getByDisplayValue('Carprofen')
    fireEvent.change(nameInput, { target: { value: 'Ibuprofen' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'name', 'Ibuprofen')
  })

  it('displays error messages for medication fields', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()
    const errors = {
      'medications.0.name': 'Medication name is required',
      'medications.1.dosage': 'Dosage must be specified',
    }

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={errors}
      />
    )

    expect(screen.getByText('Medication name is required')).toBeInTheDocument()
    expect(screen.getByText('Dosage must be specified')).toBeInTheDocument()
  })

  it('renders all field labels for each medication', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getAllByText('Medication Name')).toHaveLength(2)
    expect(screen.getAllByText('Dosage')).toHaveLength(2)
    expect(screen.getAllByText('Route')).toHaveLength(2)
    expect(screen.getAllByText('Indication')).toHaveLength(2)
  })

  it('handles changing dosage field', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const dosageInput = screen.getByDisplayValue('100mg twice daily')
    fireEvent.change(dosageInput, { target: { value: '75mg once daily' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'dosage', '75mg once daily')
  })

  it('handles changing route field', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const routeInputs = screen.getAllByDisplayValue('Oral')
    fireEvent.change(routeInputs[0], { target: { value: 'IV' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'route', 'IV')
  })

  it('handles changing indication textarea', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const indicationField = screen.getByDisplayValue('Pain relief')
    fireEvent.change(indicationField, { target: { value: 'Chronic pain management' } })

    expect(handleChange).toHaveBeenCalledWith(0, 'indication', 'Chronic pain management')
  })

  it('renders with multiple remove buttons when multiple medications exist', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()

    render(
      <MedicationListEditor
        medications={mockMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    const removeButtons = screen.getAllByText('Remove')
    expect(removeButtons).toHaveLength(2)
  })

  it('handles partial medication data with empty fields', () => {
    const handleAdd = vi.fn()
    const handleRemove = vi.fn()
    const handleChange = vi.fn()
    const incompleteMedications = [
      { name: 'Aspirin', dosage: '', route: '', indication: '' },
    ]

    render(
      <MedicationListEditor
        medications={incompleteMedications}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChange={handleChange}
        errors={{}}
      />
    )

    expect(screen.getByDisplayValue('Aspirin')).toBeInTheDocument()
    const emptyFields = screen.getAllByDisplayValue('')
    expect(emptyFields.length).toBeGreaterThan(0)
  })
})
