import { useMemo } from 'react'

export type DocumentPreviewProps = {
  fileUrl: string
  contentType?: string
}

export const DocumentPreview = ({ fileUrl, contentType }: DocumentPreviewProps) => {
  const type = useMemo(() => {
    if (contentType?.includes('pdf') || fileUrl.endsWith('.pdf')) return 'pdf'
    if (contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl)) return 'image'
    return 'unknown'
  }, [contentType, fileUrl])

  if (type === 'image') {
    return (
      <img
        src={fileUrl}
        alt="Document preview"
        className="max-h-[70vh] w-auto object-contain rounded border"
      />
    )
  }

  if (type === 'pdf') {
    return (
      <iframe
        title="PDF preview"
        src={fileUrl}
        className="w-full h-[70vh] rounded border"
      />
    )
  }

  return (
    <div className="text-sm text-gray-500">Preview not available for this file type.</div>
  )
}

export default DocumentPreview
