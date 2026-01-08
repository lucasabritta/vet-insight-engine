import React from 'react'
import { FormField } from './FormField'

interface DiagnosisListEditorProps {
  diagnoses: Array<Record<string, unknown>>
  onAdd: () => void
  onRemove: (idx: number) => void
  onChange: (idx: number, field: string, value: string) => void
  errors: Record<string, string>
}

export const DiagnosisListEditor = React.memo(function DiagnosisListEditor({
  diagnoses,
  onAdd,
  onRemove,
  onChange,
  errors,
}: DiagnosisListEditorProps) {
  return (
    <div className="space-y-3">
      {diagnoses.map((diagnosis, idx) => (
        <div key={idx} className="p-4 border border-gray-300 rounded-md bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              label="Condition"
              value={String(diagnosis.condition || '')}
              onChange={(v) => onChange(idx, 'condition', v)}
              placeholder="Diagnosis condition"
              error={errors[`diagnoses.${idx}.condition`]}
            />
            <FormField
              label="Date of Diagnosis"
              value={String(diagnosis.date || '')}
              onChange={(v) => onChange(idx, 'date', v)}
              placeholder="e.g., 28/07/20"
              error={errors[`diagnoses.${idx}.date`]}
            />
            <FormField
              label="Severity"
              value={String(diagnosis.severity || '')}
              onChange={(v) => onChange(idx, 'severity', v)}
              placeholder="e.g., Mild, Moderate, Severe"
              error={errors[`diagnoses.${idx}.severity`]}
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
          <FormField
            label="Notes"
            isTextarea={true}
            rows={2}
            value={String(diagnosis.notes || '')}
            onChange={(v) => onChange(idx, 'notes', v)}
            placeholder="Additional notes"
            error={errors[`diagnoses.${idx}.notes`]}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        + Add Diagnosis
      </button>
    </div>
  )
})
