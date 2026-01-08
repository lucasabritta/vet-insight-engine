import React from 'react'
import { FormField } from './FormField'

interface MedicationListEditorProps {
  medications: Array<Record<string, unknown>>
  onAdd: () => void
  onRemove: (idx: number) => void
  onChange: (idx: number, field: string, value: string) => void
  errors: Record<string, string>
}

export const MedicationListEditor = React.memo(function MedicationListEditor({
  medications,
  onAdd,
  onRemove,
  onChange,
  errors,
}: MedicationListEditorProps) {
  return (
    <div className="space-y-3">
      {medications.map((medication, idx) => (
        <div key={idx} className="p-4 border border-gray-300 rounded-md bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              label="Medication Name"
              value={String(medication.name || '')}
              onChange={(v) => onChange(idx, 'name', v)}
              placeholder="e.g., Carprofen"
              error={errors[`medications.${idx}.name`]}
            />
            <FormField
              label="Dosage"
              value={String(medication.dosage || '')}
              onChange={(v) => onChange(idx, 'dosage', v)}
              placeholder="e.g., 100mg twice daily"
              error={errors[`medications.${idx}.dosage`]}
            />
            <FormField
              label="Route"
              value={String(medication.route || '')}
              onChange={(v) => onChange(idx, 'route', v)}
              placeholder="e.g., Oral, IV, Topical"
              error={errors[`medications.${idx}.route`]}
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
            label="Indication"
            isTextarea={true}
            rows={2}
            value={String(medication.indication || '')}
            onChange={(v) => onChange(idx, 'indication', v)}
            placeholder="Indication for use"
            error={errors[`medications.${idx}.indication`]}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors"
      >
        + Add Medication
      </button>
    </div>
  )
})
