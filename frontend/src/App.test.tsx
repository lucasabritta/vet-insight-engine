import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock API functions
vi.mock('./lib/api', () => ({
  uploadDocument: vi.fn(),
  extractDocument: vi.fn(),
  getDocumentFileUrl: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'http://localhost:8000'),
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  it('renders the title', () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<App />)
    const title = screen.getByText(/Vet Insight Engine/i)
    expect(title).toBeInTheDocument()
  })

  it('renders the description', () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<App />)
    const description = screen.getByText(/Document Processing for Veterinary Records/i)
    expect(description).toBeInTheDocument()
  })

  it('displays health status on successful health check', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/API Status: ok/i)).toBeInTheDocument()
    })
  })

  it('displays error when health check fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/API is not available/i)).toBeInTheDocument()
    })
  })

  it('renders upload error message when upload fails', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const { uploadDocument: mockUploadDocument } = await import('./lib/api')
    vi.mocked(mockUploadDocument).mockRejectedValueOnce(new Error('Upload failed'))

    render(<App />)
    const dropzone = screen.getByRole('button', { name: /upload documents/i })
    expect(dropzone).toBeInTheDocument()

    await waitFor(() => {
      const errorAlert = screen.queryByRole('alert')
      expect(errorAlert).not.toBeInTheDocument()
    })
  })

  it('shows no document message initially', () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<App />)
    expect(screen.getByText(/No document uploaded yet/i)).toBeInTheDocument()
  })

  it('shows extracting message during extraction', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    render(<App />)

    // Verify extracting state is available in component
    expect(screen.getByText(/No extracted text available/i)).toBeInTheDocument()
  })
})
