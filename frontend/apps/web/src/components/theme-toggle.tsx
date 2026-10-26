import { useEffect, useRef } from 'react'
import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslation } from 'react-i18next'
import { Button } from '@app/ui/components/button'
import { cn } from '@app/ui/lib/utils'
import { withViewTransition } from '#/lib/view-transition'

export function ThemeToggle() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  // Animate the swap, but not the first paint: a control that spins itself as
  // the page loads reads as a glitch rather than as polish. Set from an effect
  // rather than during render, so StrictMode's double render cannot flip it
  // early.
  const painted = useRef(false)
  useEffect(() => {
    painted.current = true
  }, [])

  const Icon = isDark ? MoonIcon : SunIcon

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label={t('theme.toggle')}
      onClick={() =>
        withViewTransition(() => setTheme(isDark ? 'light' : 'dark'))
      }
    >
      {/*
        Sun and Moon are different components, so switching themes unmounts one
        and mounts the other — that remount is what replays the enter animation.
        Rendering one component with a changing prop would animate once and
        never again.

        It is an animation and not a `dark:`-variant transition on purpose. The
        provider sets `disableTransitionOnChange`, which injects
        `transition: none !important` for the frame the theme class flips in —
        precisely the frame a transition would have to start in. Animations are
        untouched by that rule.
      */}
      <Icon
        className={cn(
          'size-5',
          painted.current &&
            'animate-in spin-in-90 zoom-in-50 fade-in duration-300',
        )}
      />
    </Button>
  )
}
