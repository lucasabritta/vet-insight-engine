import { useCallback } from 'react'

interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
  isDangerous?: boolean
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  isDangerous = false,
}: ConfirmationDialogProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    },
    [isLoading, onCancel]
  )

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="presentation"
      onClick={() => !isLoading && onCancel()}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4"
        role="alertdialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-3">
          {title}
        </h2>
        <p id="dialog-description" className="text-gray-700 text-sm mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={isDangerous ? 'Delete' : 'Confirm'}
          >
            {isLoading ? 'Saving...' : isDangerous ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
