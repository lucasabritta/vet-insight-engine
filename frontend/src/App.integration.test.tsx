import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

// Hoisted mocks to satisfy Vitest hoisting
const apiMocks = vi.hoisted(() => ({
  uploadDocument: vi.fn(),
  extractDocument: vi.fn(),
  getDocumentFileUrl: vi.fn(() => 'http://localhost/file.pdf'),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

// Mock child components to simplify integration surface
vi.mock('./components/UploadDropzone', () => {
  const MockDropzone = ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button
      type="button"
      data-testid="mock-dropzone"
      onClick={() => onFilesSelected([new File(['content'], 'test.pdf', { type: 'application/pdf' })])}
    >
      Mock Dropzone
    </button>
  )
  return { __esModule: true, default: MockDropzone }
})

vi.mock('./components/DocumentPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-preview">Preview</div>,
}))

vi.mock('./components/StructuredDataEditor', () => ({
  __esModule: true,
  StructuredDataEditor: ({ docId, initialData }: { docId: string; initialData: Record<string, unknown> }) => (
    <div data-testid="structured-editor">{docId}:{JSON.stringify(initialData)}</div>
  ),
}))

vi.mock('./lib/api', () => ({
  __esModule: true,
  uploadDocument: apiMocks.uploadDocument,
  extractDocument: apiMocks.extractDocument,
  getDocumentFileUrl: apiMocks.getDocumentFileUrl,
  getApiBaseUrl: apiMocks.getApiBaseUrl,
}))

describe('App integration flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.uploadDocument.mockReset()
    apiMocks.extractDocument.mockReset()
    apiMocks.getDocumentFileUrl.mockClear()
    apiMocks.getApiBaseUrl.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockHealth = (ok = true) => {
    const response = ok
      ? new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      : Promise.reject(new Error('Network error'))
    // @ts-expect-error allow global assignment
    global.fetch = vi.fn().mockResolvedValueOnce(response)
  }

  it('runs happy path: health ok, upload + extract success', async () => {
    mockHealth(true)
    apiMocks.uploadDocument.mockResolvedValueOnce({ id: 'doc-1', filename: 'test.pdf' })
    apiMocks.extractDocument.mockResolvedValueOnce({
      id: 'doc-1',
      raw_text: 'extracted text',
      extraction_meta: {},
      record: { patient: 'Max' },
    })

    render(<App />)

    fireEvent.click(screen.getByTestId('mock-dropzone'))

    await waitFor(() => {
      expect(screen.getByText(/extracted text/i)).toBeInTheDocument()
    })

    expect(apiMocks.uploadDocument).toHaveBeenCalledTimes(1)
    expect(apiMocks.extractDocument).toHaveBeenCalledWith('doc-1')
    expect(screen.getByTestId('structured-editor')).toHaveTextContent('doc-1:{"patient":"Max"}')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows error when upload fails', async () => {
    mockHealth(true)
    apiMocks.uploadDocument.mockRejectedValueOnce(new Error('Upload failed'))

    render(<App />)

    fireEvent.click(screen.getByTestId('mock-dropzone'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Upload failed')
    })
  })

  it('shows error when extraction fails', async () => {
    mockHealth(true)
    apiMocks.uploadDocument.mockResolvedValueOnce({ id: 'doc-2', filename: 'test.pdf' })
    apiMocks.extractDocument.mockRejectedValueOnce(new Error('Extract failed'))

    render(<App />)

    fireEvent.click(screen.getByTestId('mock-dropzone'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Extract failed')
    })
  })
})
