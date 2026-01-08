import React from 'react'

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  type?: string
  isTextarea?: boolean
  rows?: number
}

const inputClass = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm`

export const FormField = React.memo(function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  isTextarea = false,
  rows = 4,
}: FormFieldProps) {
  const borderClass = error ? 'border-red-500' : 'border-gray-300'

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClass} ${borderClass} resize-vertical`}
          aria-invalid={error ? 'true' : 'false'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputClass} ${borderClass}`}
          aria-invalid={error ? 'true' : 'false'}
        />
      )}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
})
