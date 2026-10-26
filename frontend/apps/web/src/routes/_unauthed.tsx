import { createFileRoute } from '@tanstack/react-router'
import { UnauthedLayout } from '#/layouts/unauthed-layout'

export const Route = createFileRoute('/_unauthed')({
  component: UnauthedLayout,
})
