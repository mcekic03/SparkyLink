export interface LoginRequest {
  email: string
  password: string
}

export type { LoginResponse } from '../validation/login-response.schema'
