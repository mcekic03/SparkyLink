import { api } from '#/lib/api'
import { loginResponseSchema } from '../validation/login-response.schema'
import type { LoginRequest } from '../types'
import type { LoginResponse } from '../validation/login-response.schema'

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<unknown>('/api/admin/login', data)
  return loginResponseSchema.parse(response.data)
}
