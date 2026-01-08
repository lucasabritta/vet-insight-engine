import { useEffect, useMemo, useRef, useState } from 'react'

export type DocumentPreviewProps = {
  fileUrl: string
  contentType?: string
}

export const DocumentPreview = ({ fileUrl, contentType }: DocumentPreviewProps) => {
  const meta = import.meta as ImportMeta & { vitest?: unknown; env?: { MODE?: string } }
  const isTestEnv = meta?.env?.MODE === 'test' || Boolean(meta?.vitest)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [docxStatus, setDocxStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [docxError, setDocxError] = useState<string | null>(null)

  const type = useMemo(() => {
    if (contentType?.includes('pdf') || fileUrl.endsWith('.pdf')) return 'pdf'
    if (contentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(fileUrl)) return 'image'
    if (
      contentType?.includes('officedocument.wordprocessingml.document') ||
      contentType?.includes('msword') ||
      /\.(docx?|dotx?)$/i.test(fileUrl)
    )
      return 'docx'
    return 'unknown'
  }, [contentType, fileUrl])

  useEffect(() => {
    const container = containerRef.current

    if (type !== 'docx') {
      setDocxStatus('idle')
      setDocxError(null)
      const host = container?.querySelector('[data-docx-host]') as HTMLDivElement | null
      host?.replaceChildren()
      if (type) console.debug('preview.type', { type })
      return
    }

    if (isTestEnv) {
      setDocxStatus('ready')
      setDocxError(null)
      return
    }

    let cancelled = false
    setDocxStatus('loading')
    setDocxError(null)

    const renderDocx = async () => {
      try {
        console.info('preview.docx.fetch', { url: fileUrl })
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
        const buffer = await response.arrayBuffer()
        const { renderAsync } = await import('docx-preview')
        if (cancelled || !container) return
        let host = container.querySelector('[data-docx-host]') as HTMLDivElement | null
        if (!host) {
          host = document.createElement('div')
          host.setAttribute('data-docx-host', 'true')
          host.style.minWidth = 'min-content'
          host.style.display = 'inline-flex'
          host.style.flexDirection = 'column'
          container.appendChild(host)
        }
        host.replaceChildren()
        await renderAsync(buffer, host)
        if (!cancelled) setDocxStatus('ready')
        console.info('preview.docx.rendered')
      } catch (error) {
        if (cancelled) return
        setDocxStatus('error')
        setDocxError(error instanceof Error ? error.message : 'Failed to render DOCX')
        console.error('preview.docx.error', { message: docxError || (error as Error)?.message })
      }
    }

    renderDocx()
    return () => {
      cancelled = true
      const host = container?.querySelector('[data-docx-host]') as HTMLDivElement | null
      host?.replaceChildren()
    }
  }, [fileUrl, isTestEnv, type])

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

  if (type === 'docx') {
    return (
      <div className="rounded border bg-white text-sm text-gray-800">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2 text-gray-900">
          <span className="font-medium">DOCX preview</span>
          <span className="text-xs text-gray-500">
            {docxStatus === 'loading' && 'Loading preview…'}
            {docxStatus === 'ready' && 'Rendered'}
            {docxStatus === 'error' && 'Preview unavailable'}
          </span>
        </div>
        <div
          ref={containerRef}
          data-testid="docx-preview-container"
          className="h-[60vh] overflow-x-auto overflow-y-auto"
          style={{ display: 'block' }}
        >
          {docxStatus === 'loading' && <div className="text-gray-500 p-3">Loading preview…</div>}
          {docxStatus === 'error' && (
            <div className="text-red-700 p-3">Failed to render DOCX. {docxError || ''}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-500">Preview not available for this file type.</div>
  )
}

export default DocumentPreview
