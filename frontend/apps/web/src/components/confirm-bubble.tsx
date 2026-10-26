import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@app/ui/components/popover'
import { cn } from '@app/ui/lib/utils'
import type { ReactNode } from 'react'

interface ConfirmBubbleProps {
  /** The control that asks for confirmation. Rendered as the trigger. */
  children: ReactNode
  /** Defaults to "Are you sure?". Pass a specific question where one helps. */
  message?: string
  onConfirm: () => void
  /**
   * Defaults to the left: the row actions sit in a column pinned to the right
   * edge, where a bubble above or below has nowhere to go and gets shoved back
   * over the button it is asking about.
   */
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

/**
 * Two clicks to destroy something: the control, then the question that appears
 * beside it.
 *
 * `window.confirm` blocks the whole page, cannot be styled, is worded by the
 * browser, and appears at the top of the window — nowhere near the row being
 * acted on, which is exactly where the user is looking. This asks in place.
 *
 * The question is itself the confirm button rather than a bubble containing
 * one: at this size a caption plus a button reads as two things to decide
 * between, and there is only one thing to do. Clicking elsewhere or pressing
 * Escape cancels, which is the safe direction.
 */
export function ConfirmBubble({
  children,
  message,
  onConfirm,
  side = 'left',
  align = 'center',
}: ConfirmBubbleProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          'w-auto rounded-lg p-1',
          // The arrow: a rotated square tucked half under the panel, on
          // whichever side Radix actually placed the bubble — it flips the
          // side itself when there is no room.
          //
          // The translate is the whole trick: `left-1/2` alone puts the
          // arrow's *left edge* at the midpoint, which reads as an arrow
          // hanging off to one side rather than pointing at anything.
          'after:absolute after:size-2 after:rotate-45 after:bg-popover after:border-b after:border-r after:border-border',
          'data-[side=top]:after:-bottom-1 data-[side=top]:after:left-1/2 data-[side=top]:after:-translate-x-1/2',
          'data-[side=bottom]:after:-top-1 data-[side=bottom]:after:left-1/2 data-[side=bottom]:after:-translate-x-1/2 data-[side=bottom]:after:rotate-[225deg]',
          'data-[side=left]:after:-right-1 data-[side=left]:after:top-1/2 data-[side=left]:after:-translate-y-1/2 data-[side=left]:after:rotate-[315deg]',
          'data-[side=right]:after:-left-1 data-[side=right]:after:top-1/2 data-[side=right]:after:-translate-y-1/2 data-[side=right]:after:rotate-[135deg]',
        )}
      >
        <button
          type="button"
          autoFocus
          onClick={() => {
            setOpen(false)
            onConfirm()
          }}
          className="rounded-md px-2.5 py-1.5 text-sm font-medium whitespace-nowrap text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none"
        >
          {message ?? t('common.areYouSure')}
        </button>
      </PopoverContent>
    </Popover>
  )
}
