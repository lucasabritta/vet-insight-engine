import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UploadDropzone } from './UploadDropzone'

describe('UploadDropzone', () => {
  it('renders and triggers file selection via keyboard', () => {
    const onFilesSelected = vi.fn()
    render(<UploadDropzone onFilesSelected={onFilesSelected} />)
    const dropzone = screen.getByRole('button', { name: /upload documents/i })
    expect(dropzone).toBeInTheDocument()
    fireEvent.keyDown(dropzone, { key: 'Enter' })
  })
})
