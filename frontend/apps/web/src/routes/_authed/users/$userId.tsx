import { createFileRoute } from '@tanstack/react-router'
import { UserRole } from '#/types/user'
import { EditUserPage } from '#/features/users/pages/edit-user.page'

function EditUserRoute() {
  const { userId } = Route.useParams()
  return <EditUserPage userId={userId} />
}

export const Route = createFileRoute('/_authed/users/$userId')({
  component: EditUserRoute,
  staticData: { roles: [UserRole.SuperAdmin] },
})
