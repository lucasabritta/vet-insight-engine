import { useEffect, useMemo, useState } from 'react'
import UploadDropzone from './components/UploadDropzone'
import DocumentPreview from './components/DocumentPreview'
import { extractDocument, getDocumentFileUrl, uploadDocument } from './lib/api'

function App() {
  const [status, setStatus] = useState<string>('Loading...')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState<boolean>(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        const data = await response.json()
        setStatus(`API Status: ${data.status}`)
      } catch (error) {
        setStatus('API is not available')
      }
    }

    checkHealth()
  }, [])

  const handleFilesSelected = async (files: File[]) => {
    setUploadError(null)
    const file = files[0]
    setSelectedFile(file)
    setUploadProgress(10)
    try {
      const result = await uploadDocument(file)
      setUploadProgress(60)
      setDocId(result.id)
      // Trigger extraction
      setIsExtracting(true)
      const extracted = await extractDocument(result.id)
      setUploadProgress(100)
      setRawText(extracted.raw_text || '')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed'
      setUploadError(message)
    } finally {
      setIsExtracting(false)
      setTimeout(() => setUploadProgress(0), 1200)
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
            <div className="mt-3 w-full bg-gray-200 rounded h-2" aria-label="Upload progress">
              <div className="h-2 rounded bg-blue-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          {uploadError && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2" role="alert">
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
            {isExtracting && <div className="text-sm text-gray-500">Extracting…</div>}
            {!isExtracting && rawText && (
              <div className="bg-white border rounded p-3 h-[70vh] overflow-auto whitespace-pre-wrap text-sm text-gray-800">
                {rawText}
              </div>
            )}
            {!isExtracting && !rawText && (
              <div className="text-sm text-gray-500">No extracted text available.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
