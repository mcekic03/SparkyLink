import { createFileRoute } from '@tanstack/react-router'
import { UserRole } from '#/types/user'
import { CreateUserPage } from '#/features/users/pages/create-user.page'

export const Route = createFileRoute('/_authed/users/new')({
  component: CreateUserPage,
  staticData: { roles: [UserRole.SuperAdmin] },
})
