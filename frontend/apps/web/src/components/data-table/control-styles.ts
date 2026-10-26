/**
 * Hover states for the table toolbar's controls, in one place so the row cannot
 * drift apart a control at a time.
 *
 * Both follow what the primitives already do rather than inventing a third
 * treatment: `SelectTrigger` ships `hover:bg-accent/40`, and the ghost buttons
 * in the toolbar hover to full `accent`.
 *
 * They exist because two primitives here have no hover of their own. `Input`
 * styles focus only, so a field gives no sign it is interactive until clicked;
 * and the `outline` button variant hovers to `muted`, a 4.5% lightness step
 * against the card it sits on — in the stylesheet, invisible on screen.
 */
export const TOOLBAR_BUTTON_HOVER =
  'hover:bg-accent hover:text-accent-foreground ' +
  // Stacked with aria-expanded, not because the open state wants a different
  // colour, but to win a specificity tie. Both variants compile to (0,2,0):
  // `.hover\:bg-accent:hover` and `.aria-expanded\:bg-secondary[aria-expanded=true]`.
  // The aria-expanded rule is emitted later, so it takes the tie, and a button
  // holding a panel open stops responding to the pointer entirely. Stacking
  // makes the hover (0,3,0), which settles it whatever the order.
  'aria-expanded:hover:bg-accent aria-expanded:hover:text-accent-foreground'

/**
 * Opaque, and paired with a border change, because a translucent tint is only
 * as visible as the gap between it and whatever the field rests on.
 * `SelectTrigger`'s own `hover:bg-accent/40` composites to 0.976 in the light
 * theme: a 2.4% step for a field on white, and 0.1% — nothing at all — for the
 * search field, which rests on `bg-background` at 0.975.
 *
 * `bg-accent` is 3.5% against the search field and 6% against a white one, and
 * the ring on the border carries the rest of the signal.
 */
export const TOOLBAR_FIELD_HOVER = 'hover:border-ring/50 hover:bg-accent'
