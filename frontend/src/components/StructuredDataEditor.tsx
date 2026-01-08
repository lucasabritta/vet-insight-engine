import { useState, useCallback } from 'react'
import { ConfirmationDialog } from './ConfirmationDialog'
import { FormField } from './FormField'
import { DiagnosisListEditor } from './DiagnosisListEditor'
import { MedicationListEditor } from './MedicationListEditor'
import { useFormData } from '../hooks/useFormData'
import { useSaveState } from '../hooks/useSaveState'
import { updateDocument, VeterinaryRecord } from '../lib/api'

interface StructuredDataEditorProps {
  docId: string
  initialData: VeterinaryRecord
  onSaveSuccess?: () => void
  onSaveError?: (error: string) => void
}

export function StructuredDataEditor({
  docId,
  initialData,
  onSaveSuccess,
  onSaveError,
}: StructuredDataEditorProps) {
  // State management
  const [errors] = useState<Record<string, string>>({})

  const { formData, isDirty, getFormValue, updateField, updateNestedArray, resetDirty } =
    useFormData(initialData)
  const saveState = useSaveState()
  // Array operations
  const handleAddDiagnosis = useCallback(() => {
    updateNestedArray('diagnoses', (current) => [
      ...current,
      { condition: '', date: '', severity: '', notes: '' },
    ])
  }, [updateNestedArray])

  const handleRemoveDiagnosis = useCallback(
    (idx: number) => {
      updateNestedArray('diagnoses', (current) => current.filter((_, i) => i !== idx))
    },
    [updateNestedArray]
  )

  const handleDiagnosisChange = useCallback(
    (idx: number, field: string, value: string) => {
      updateNestedArray('diagnoses', (current) => {
        const updated = [...current]
        updated[idx] = { ...updated[idx], [field]: value }
        return updated
      })
    },
    [updateNestedArray]
  )

  const handleAddMedication = useCallback(() => {
    updateNestedArray('medications', (current) => [
      ...current,
      { name: '', dosage: '', route: '', indication: '' },
    ])
  }, [updateNestedArray])

  const handleRemoveMedication = useCallback(
    (idx: number) => {
      updateNestedArray('medications', (current) => current.filter((_, i) => i !== idx))
    },
    [updateNestedArray]
  )

  const handleMedicationChange = useCallback(
    (idx: number, field: string, value: string) => {
      updateNestedArray('medications', (current) => {
        const updated = [...current]
        updated[idx] = { ...updated[idx], [field]: value }
        return updated
      })
    },
    [updateNestedArray]
  )

  // Save operations
  const handleSave = useCallback(async () => {
    saveState.beginSave()

    try {
      await updateDocument(docId, formData)
      saveState.completeSave()
      saveState.resetConfirmation()
      onSaveSuccess?.()
      resetDirty()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save record'
      saveState.failSave(errorMsg)
      onSaveError?.(errorMsg)
    }
  }, [docId, formData, saveState, onSaveSuccess, onSaveError, resetDirty])

  const handleSubmitClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    saveState.setShowConfirmation(true)
  }

  // Helpers
  const getDiagnoses = (): Array<Record<string, unknown>> => {
    return (formData.diagnoses as Array<Record<string, unknown>>) || []
  }

  const getMedications = (): Array<Record<string, unknown>> => {
    return (formData.medications as Array<Record<string, unknown>>) || []
  }


  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm" role="region" aria-labelledby="editor-title">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 id="editor-title" className="text-2xl font-bold text-gray-900">
            Extracted Medical Record
          </h2>
          <p className="text-sm text-gray-600 mt-1">Review and edit the extracted veterinary data below</p>
        </div>
        <div className="flex items-center gap-2">
          {saveState.saveSuccess && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center gap-2">
              <span>✓</span> Saved
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {saveState.saveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm" role="alert">
          Error: {saveState.saveError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitClick} className="space-y-8">
        {/* Pet Information */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Pet Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Pet Name"
              value={getFormValue('pet.name')}
              onChange={(v) => updateField('pet.name', v)}
              placeholder="e.g., Buddy"
            />
            <FormField
              label="Species"
              value={getFormValue('pet.species')}
              onChange={(v) => updateField('pet.species', v)}
              placeholder="e.g., Dog, Cat"
            />
            <FormField
              label="Breed"
              value={getFormValue('pet.breed')}
              onChange={(v) => updateField('pet.breed', v)}
              placeholder="e.g., Golden Retriever"
            />
            <FormField
              label="Age"
              value={getFormValue('pet.age')}
              onChange={(v) => updateField('pet.age', v)}
              placeholder="e.g., 5 years"
            />
            <FormField
              label="Weight"
              value={getFormValue('pet.weight')}
              onChange={(v) => updateField('pet.weight', v)}
              placeholder="e.g., 30 kg"
            />
            <FormField
              label="Microchip ID"
              value={getFormValue('pet.microchip')}
              onChange={(v) => updateField('pet.microchip', v)}
              placeholder="Microchip ID"
            />
          </div>
        </section>

        {/* Clinic & Veterinarian */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Clinic & Veterinarian
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Clinic Name"
              value={getFormValue('clinic_name')}
              onChange={(v) => updateField('clinic_name', v)}
            />
            <FormField
              label="Veterinarian"
              value={getFormValue('veterinarian')}
              onChange={(v) => updateField('veterinarian', v)}
            />
            <FormField
              label="Visit Date"
              type="date"
              value={getFormValue('visit_date')}
              onChange={(v) => updateField('visit_date', v)}
            />
          </div>
        </section>

        {/* Clinical Details */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Clinical Details
          </h3>
          <FormField
            label="Chief Complaint"
            value={getFormValue('chief_complaint')}
            onChange={(v) => updateField('chief_complaint', v)}
          />
          <FormField
            label="Clinical History"
            isTextarea={true}
            rows={3}
            value={getFormValue('clinical_history')}
            onChange={(v) => updateField('clinical_history', v)}
          />
          <FormField
            label="Physical Examination"
            isTextarea={true}
            rows={3}
            value={getFormValue('physical_examination')}
            onChange={(v) => updateField('physical_examination', v)}
          />
        </section>

        {/* Diagnoses */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Diagnoses
          </h3>
          <DiagnosisListEditor
            diagnoses={getDiagnoses()}
            onAdd={handleAddDiagnosis}
            onRemove={handleRemoveDiagnosis}
            onChange={handleDiagnosisChange}
            errors={errors}
          />
        </section>

        {/* Medications */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Medications
          </h3>
          <MedicationListEditor
            medications={getMedications()}
            onAdd={handleAddMedication}
            onRemove={handleRemoveMedication}
            onChange={handleMedicationChange}
            errors={errors}
          />
        </section>

        {/* Treatment Plan */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
            Treatment & Follow-up
          </h3>
          <FormField
            label="Treatment Plan"
            isTextarea={true}
            rows={3}
            value={getFormValue('treatment_plan')}
            onChange={(v) => updateField('treatment_plan', v)}
          />
          <FormField
            label="Prognosis"
            isTextarea={true}
            rows={2}
            value={getFormValue('prognosis')}
            onChange={(v) => updateField('prognosis', v)}
          />
          <FormField
            label="Follow-up"
            isTextarea={true}
            rows={2}
            value={getFormValue('follow_up')}
            onChange={(v) => updateField('follow_up', v)}
          />
          <FormField
            label="Notes"
            isTextarea={true}
            rows={2}
            value={getFormValue('notes')}
            onChange={(v) => updateField('notes', v)}
          />
        </section>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={!isDirty || saveState.isSaving}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saveState.isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <p className={`text-sm font-medium ${isDirty ? 'text-amber-600' : 'text-green-600'}`}>
            {isDirty ? '✎ Unsaved changes' : '✓ All saved'}
          </p>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={saveState.showConfirmation}
        title="Save Medical Record"
        message="Save all changes?"
        onConfirm={handleSave}
        onCancel={saveState.resetConfirmation}
        isLoading={saveState.isSaving}
      />
    </div>
  )
}
