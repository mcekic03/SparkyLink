import { createFileRoute } from '@tanstack/react-router'
import { SignInPage } from '#/features/auth/pages/sign-in.page'
import { signInSearchSchema } from '#/features/auth/validation/sign-in-search.schema'

function SignInRoute() {
  const { redirect } = Route.useSearch()
  return <SignInPage redirect={redirect} />
}

export const Route = createFileRoute('/_unauthed/sign-in')({
  validateSearch: signInSearchSchema,
  component: SignInRoute,
})
