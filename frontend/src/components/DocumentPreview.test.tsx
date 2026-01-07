import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DocumentPreview } from './DocumentPreview'

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
})
