import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DocumentPreview } from './DocumentPreview'

const renderAsyncMock = vi.fn(async (_buffer: ArrayBuffer, container?: HTMLElement | null) => {
  if (container) {
    const node = container.ownerDocument.createElement('div')
    node.textContent = 'docx content'
    container.appendChild(node)
  }
})

vi.mock(
  'docx-preview',
  () => ({
    __esModule: true,
    renderAsync: renderAsyncMock,
  })
)

afterEach(() => {
  vi.resetAllMocks()
  // @ts-expect-error allow reset
  global.fetch = undefined
})

describe('DocumentPreview', () => {
  it('renders image tag for image URL', () => {
    render(<DocumentPreview fileUrl="http://localhost/file.png" contentType="image/png" />)
    const img = screen.getByAltText(/document preview/i) as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('http://localhost/file.png')
  })

  it('renders iframe for PDFs', () => {
    render(<DocumentPreview fileUrl="http://localhost/file.pdf" contentType="application/pdf" />)
    const iframe = screen.getByTitle(/pdf preview/i)
    expect(iframe).toBeInTheDocument()
  })

  it('renders docx preview with loading and status states', async () => {
    const buffer = new ArrayBuffer(8)
    // @ts-expect-error allow global assignment for tests
    global.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        })
      )
    )

    render(
      <DocumentPreview
        fileUrl="http://localhost/file.docx"
        contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
    )

    expect(screen.getByText(/DOCX preview/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(/Rendered/i)).toBeInTheDocument())
  })
})
