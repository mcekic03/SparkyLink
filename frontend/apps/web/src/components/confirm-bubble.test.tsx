/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@app/ui/components/button'
import { ConfirmBubble } from './confirm-bubble'

function renderBubble(onConfirm: () => void, message?: string) {
  return render(
    <ConfirmBubble onConfirm={onConfirm} message={message}>
      <Button>Delete</Button>
    </ConfirmBubble>,
  )
}

describe('ConfirmBubble', () => {
  it('takes two clicks: the control, then the question', async () => {
    const onConfirm = vi.fn()
    renderBubble(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).not.toHaveBeenCalled()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Are you sure?' }),
    )
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('cancels on Escape without acting', async () => {
    const onConfirm = vi.fn()
    renderBubble(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByRole('button', { name: 'Are you sure?' })
    await userEvent.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Are you sure?' })).toBeNull()
    })
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('closes after confirming, so the next click starts over', async () => {
    const onConfirm = vi.fn()
    renderBubble(onConfirm)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await userEvent.click(
      await screen.findByRole('button', { name: 'Are you sure?' }),
    )

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Are you sure?' })).toBeNull()
    })
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('asks a specific question when given one', async () => {
    renderBubble(vi.fn(), 'Delete the selected users?')

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(
      await screen.findByRole('button', { name: 'Delete the selected users?' }),
    ).toBeVisible()
  })
})
