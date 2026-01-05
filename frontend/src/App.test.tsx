import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

describe('App', () => {
  it('renders the title', () => {
    render(<App />)
    const title = screen.getByText(/Vet Insight Engine/i)
    expect(title).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<App />)
    const description = screen.getByText(/Document Processing for Veterinary Records/i)
    expect(description).toBeInTheDocument()
  })
})
