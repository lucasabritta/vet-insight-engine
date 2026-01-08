import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ConfirmationDialog } from './ConfirmationDialog'

describe('ConfirmationDialog', () => {
  it('does not render when closed', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    const { container } = render(
      <ConfirmationDialog
        isOpen={false}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // When closed, the component should not render any content
    expect(container.innerHTML).not.toContain('Test Dialog')
  })

  it('renders when open', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
    expect(screen.getByText('This is a test')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('disables buttons when loading', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
        isLoading={true}
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })

    expect(confirmButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()
    // The button should show loading text
    expect(confirmButton).toHaveTextContent('Saving...')
  })

  it('shows custom button text for dangerous actions', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Delete Record"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
        isDangerous={true}
      />
    )

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('calls onCancel when escape key is pressed', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    const dialog = screen.getByRole('alertdialog')
    // Fire a keyboard event directly on the dialog container
    fireEvent.keyDown(dialog.parentElement!, { key: 'Escape' })

    expect(onCancel).toHaveBeenCalled()
  })

  it('renders with correct accessibility attributes', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmationDialog
        isOpen={true}
        title="Test Dialog"
        message="This is a test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description')
  })
})
