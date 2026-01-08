import { useEffect, useMemo, useState } from 'react'
import UploadDropzone from './components/UploadDropzone'
import DocumentPreview from './components/DocumentPreview'
import { StructuredDataEditor } from './components/StructuredDataEditor'
import { extractDocument, getDocumentFileUrl, uploadDocument, getApiBaseUrl } from './lib/api'

const UPLOAD_PROGRESS_START = 10
const UPLOAD_PROGRESS_FETCH = 60
const UPLOAD_PROGRESS_COMPLETE = 100
const PROGRESS_RESET_DELAY_MS = 1200

function App() {
  const [status, setStatus] = useState<string>('Loading...')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.debug('health.check.start')
        const baseUrl = getApiBaseUrl()
        const response = await fetch(`${baseUrl}/health`)
        const data = await response.json()
        setStatus(`API Status: ${data.status}`)
        console.debug('health.check.success', { status: data.status })
      } catch {
        setStatus('API is not available')
        console.error('health.check.error')
      }
    }

    checkHealth()
  }, [])

  const handleFilesSelected = async (files: File[]) => {
    setUploadError(null)
    setExtractedData(null)
    const file = files[0]
    setSelectedFile(file)
    setUploadProgress(UPLOAD_PROGRESS_START)
    try {
      console.info('upload.start', { name: file.name, size: file.size, type: file.type })
      const result = await uploadDocument(file)
      setUploadProgress(UPLOAD_PROGRESS_FETCH)
      setDocId(result.id)
      // Trigger extraction
      setIsExtracting(true)
      console.info('extract.start', { id: result.id })
      const extracted = await extractDocument(result.id)
      setUploadProgress(UPLOAD_PROGRESS_COMPLETE)
      setRawText(extracted.raw_text || '')
      setExtractedData(extracted.record || {})
      console.info('extract.success', { id: result.id })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setUploadError(message)
      console.error('upload.extract.error', { message })
    } finally {
      setIsExtracting(false)
      setTimeout(() => setUploadProgress(0), PROGRESS_RESET_DELAY_MS)
    }
  }

  const fileUrl = useMemo(() => (docId ? getDocumentFileUrl(docId) : ''), [docId])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Vet Insight Engine</h1>
          <p className="text-gray-600">Document Processing for Veterinary Records</p>
          <div className="mt-2 inline-block bg-blue-50 border border-blue-200 rounded px-3 py-1 text-sm text-blue-900">
            {status}
          </div>
        </header>

        <section className="mb-6">
          <UploadDropzone
            onFilesSelected={handleFilesSelected}
            accept={{
              'application/pdf': ['.pdf'],
              'image/*': ['.png', '.jpg', '.jpeg'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
              'application/msword': ['.doc'],
            }}
          />
          {uploadProgress > 0 && (
            <div className="mt-3 w-full bg-gray-200 rounded h-2" aria-label="Upload progress" aria-live="polite" aria-atomic="true">
              <div className="h-2 rounded bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {uploadError && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2" role="alert" aria-live="assertive">
              {uploadError}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Original Document</h2>
            {!selectedFile && <div className="text-sm text-gray-500">No document uploaded yet.</div>}
            {docId && (
              <DocumentPreview fileUrl={fileUrl} contentType={selectedFile?.type} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Extracted Text</h2>
            {isExtracting && (
              <div className="flex flex-col items-center justify-center bg-white border rounded p-6 h-[70vh]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Extracting text from document…</p>
                </div>
              </div>
            )}
            {!isExtracting && rawText && (
              <div className="bg-white border rounded p-3 h-[70vh] overflow-auto whitespace-pre-wrap text-sm text-gray-800" aria-label="Extracted text from document" role="region">
                {rawText}
              </div>
            )}
            {!isExtracting && !rawText && (
              <div className="text-sm text-gray-500">No extracted text available.</div>
            )}
          </div>
        </section>

        {extractedData && docId && (
          <section className="mt-8">
            <StructuredDataEditor
              docId={docId}
              initialData={extractedData}
              onSaveSuccess={() => {
                setUploadError(null)
              }}
              onSaveError={(error) => {
                setUploadError(error)
              }}
            />
          </section>
        )}
      </div>
    </div>
  )
}

export default App
