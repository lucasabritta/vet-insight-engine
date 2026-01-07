import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export type UploadDropzoneProps = {
  onFilesSelected: (files: File[]) => void
  accept?: Record<string, string[]>
  multiple?: boolean
}

export const UploadDropzone = ({ onFilesSelected, accept, multiple = false }: UploadDropzoneProps) => {
  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted || accepted.length === 0) return
      onFilesSelected(multiple ? accepted : [accepted[0]])
    },
    [onFilesSelected, multiple]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handleDrop, accept, multiple })

  return (
    <div
      {...getRootProps({
        role: 'button',
        tabIndex: 0,
        'aria-label': 'Upload documents',
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const input = (e.currentTarget.querySelector('input[type=file]') as HTMLInputElement) || null
            input?.click()
          }
        },
        className:
          'w-full border-2 border-dashed rounded-lg p-6 text-center transition ' +
          (isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'),
      })}
    >
      <input {...getInputProps()} />
      <p className="text-gray-700">
        {isDragActive ? 'Drop the files here…' : 'Drag and drop a document here, or click to select'}
      </p>
      <p className="text-xs text-gray-500 mt-2">Accepted: PDF, PNG, JPEG, DOCX</p>
    </div>
  )
}

export default UploadDropzone
