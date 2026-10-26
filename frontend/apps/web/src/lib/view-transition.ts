import { flushSync } from 'react-dom'

/**
 * Apply a DOM update inside a View Transition, so the browser cross-fades the
 * old and new frames instead of cutting between them.
 *
 * This is how a theme switch animates every surface at once. Transitioning
 * colours per element does not work here: only ten components in `packages/ui`
 * declare `transition-colors`, so buttons and table rows would fade while the
 * page background, the sidebar and every card snapped. Declaring a transition
 * on everything instead repaints the whole viewport each frame, because
 * `background-color` is not composited the way `transform` and `opacity` are.
 * A view transition is one snapshot cross-faded on the GPU.
 *
 * `flushSync` is not optional. The browser captures the "after" state when the
 * callback returns, and React would otherwise still be holding the update in a
 * batch — the transition would capture two identical frames and appear to do
 * nothing.
 *
 * Browsers without the API get the update with no animation, which is exactly
 * what they did before. `prefers-reduced-motion` is honoured in styles.css,
 * where the animation is switched off rather than the update being skipped.
 */
export function withViewTransition(update: () => void): void {
  // `in`, not a truthiness check on the method: lib.dom declares
  // `startViewTransition` as always present, so `!document.startViewTransition`
  // is dead code to the typechecker even though it is exactly the browsers
  // without it that need this branch.
  if (!('startViewTransition' in document)) {
    update()
    return
  }

  document.startViewTransition(() => {
    flushSync(update)
  })
}
