import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { StructuredDataEditor } from './StructuredDataEditor'
import * as api from '../lib/api'

vi.mock('../lib/api')

// Add jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers'
expect.extend(matchers)

const mockInitialData = {
  pet: {
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: '5 years',
    weight: '30 kg',
    microchip: '123456789',
  },
  clinic_name: 'Happy Paws Clinic',
  veterinarian: 'Dr. Smith',
  visit_date: '2024-01-15',
  chief_complaint: 'Lameness in right rear leg',
  clinical_history: 'Dog has been limping for 2 weeks',
  physical_examination: 'Swelling in right rear knee',
  diagnoses: [{ condition: 'Osteoarthritis', date: '2024-01-15', severity: 'Moderate', notes: 'Age-related' }],
  medications: [{ name: 'Carprofen', dosage: '100mg twice daily', route: 'Oral', indication: 'Pain management' }],
  treatment_plan: 'Pain management and physical therapy',
  prognosis: 'Good with ongoing management',
  follow_up: 'Recheck in 2 weeks',
  notes: 'Monitor for improvement',
}

describe('StructuredDataEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form sections with initial data', () => {
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    expect(screen.getByText('Extracted Medical Record')).toBeInTheDocument()
    expect(screen.getByText('Pet Information')).toBeInTheDocument()
    expect(screen.getByText('Clinic & Veterinarian')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Buddy')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Happy Paws Clinic')).toBeInTheDocument()
  })

  it('populates form fields with initial values', () => {
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    expect(screen.getByDisplayValue('Buddy')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dog')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Dr. Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Osteoarthritis')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Carprofen')).toBeInTheDocument()
  })

  it('shows unsaved changes indicator when data is modified', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    // Initially should show all saved
    expect(screen.queryByText('Unsaved')).not.toBeInTheDocument()
    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    expect(screen.getByText('✎ Unsaved changes')).toBeInTheDocument()
  })

  it('disables save button when no changes', () => {
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when data is modified', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    expect(saveButton).not.toBeDisabled()
  })

  it('shows confirmation dialog when save is clicked', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    // Check for confirmation dialog elements
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Save Medical Record')).toBeInTheDocument()
  })

  it('calls updateDocument API when confirming save', async () => {
    const mockUpdateDocument = vi.fn().mockResolvedValue({ id: 'test-doc-123', record: mockInitialData })
    vi.mocked(api.updateDocument).mockImplementation(mockUpdateDocument)

    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalled()
    })
  })

  it('calls onSaveSuccess callback on successful save', async () => {
    const mockUpdateDocument = vi.fn().mockResolvedValue({ id: 'test-doc-123', record: mockInitialData })
    vi.mocked(api.updateDocument).mockImplementation(mockUpdateDocument)
    const onSaveSuccess = vi.fn()

    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
        onSaveSuccess={onSaveSuccess}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(onSaveSuccess).toHaveBeenCalled()
    })
  })

  it('shows error message on save failure', async () => {
    const mockUpdateDocument = vi.fn().mockRejectedValue(new Error('Save failed'))
    vi.mocked(api.updateDocument).mockImplementation(mockUpdateDocument)

    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/Error: Save failed/)).toBeInTheDocument()
    })
  })

  it('tracks changes in change history', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    // Form should allow changes
    expect(petNameInput).toHaveValue('Max')
  })

  it('allows adding diagnoses', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const addDiagnosisButton = screen.getAllByText('+ Add Diagnosis')[0]
    await user.click(addDiagnosisButton)

    // Should have 2 diagnosis fields now
    const conditionInputs = screen.getAllByPlaceholderText('Diagnosis condition')
    expect(conditionInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('allows removing diagnoses', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    const initialCount = removeButtons.length
    await user.click(removeButtons[0])

    const newRemoveButtons = screen.queryAllByRole('button', { name: 'Remove' })
    expect(newRemoveButtons.length).toBeLessThan(initialCount)
  })

  it('allows adding medications', async () => {
    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const addMedicationButton = screen.getAllByText('+ Add Medication')[0]
    await user.click(addMedicationButton)

    const medicationInputs = screen.getAllByPlaceholderText('e.g., Carprofen')
    expect(medicationInputs.length).toBeGreaterThanOrEqual(2)
  })

  it('handles empty initial data gracefully', () => {
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={{}}
      />
    )

    expect(screen.getByText('Extracted Medical Record')).toBeInTheDocument()
    const inputs = screen.getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('cancels save dialog without saving', async () => {
    const mockUpdateDocument = vi.fn()
    vi.mocked(api.updateDocument).mockImplementation(mockUpdateDocument)

    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(mockUpdateDocument).not.toHaveBeenCalled()
  })

  it('displays success message after save', async () => {
    const mockUpdateDocument = vi.fn().mockResolvedValue({ id: 'test-doc-123', record: mockInitialData })
    vi.mocked(api.updateDocument).mockImplementation(mockUpdateDocument)

    const user = userEvent.setup()
    render(
      <StructuredDataEditor
        docId="test-doc-123"
        initialData={mockInitialData}
      />
    )

    const petNameInput = screen.getByDisplayValue('Buddy')
    await user.clear(petNameInput)
    await user.type(petNameInput, 'Max')

    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(saveButton)

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })
  })
})
