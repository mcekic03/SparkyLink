import { api } from '#/lib/api'
import {
  messageResponseSchema,
  userResponseSchema,
  usersResponseSchema,
} from '../validation/user-response.schema'
import type { PaginatedResponse } from '#/types/api'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
  UsersParams,
} from '../types'

// Responses are parsed, not asserted: `api.get<T>()` checks nothing at runtime.

export async function fetchUsers(
  params: UsersParams,
): Promise<PaginatedResponse<User>> {
  const response = await api.get<unknown>('/api/admin/users', { params })
  return usersResponseSchema.parse(response.data)
}

export async function fetchUser(id: string): Promise<User> {
  const response = await api.get<unknown>(`/api/admin/users/${id}`)
  return userResponseSchema.parse(response.data).data
}

export async function createUser(
  data: CreateUserPayload,
): Promise<{ message: string }> {
  const response = await api.post<unknown>('/api/admin/users', data)
  return messageResponseSchema.parse(response.data)
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload,
): Promise<{ message: string }> {
  const response = await api.patch<unknown>(`/api/admin/users/${id}`, data)
  return messageResponseSchema.parse(response.data)
}

export async function deleteUser(id: string): Promise<{ message: string }> {
  const response = await api.delete<unknown>(`/api/admin/users/${id}`)
  return messageResponseSchema.parse(response.data)
}
