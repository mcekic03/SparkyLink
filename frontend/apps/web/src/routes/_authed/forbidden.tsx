import { createFileRoute } from '@tanstack/react-router'
import { RouteForbiddenComponent } from '#/components/router-error'

// No `roles`, so the guard always lets a signed-in user reach it — otherwise a
// forbidden visit would redirect here and be forbidden again.
export const Route = createFileRoute('/_authed/forbidden')({
  component: RouteForbiddenComponent,
})
