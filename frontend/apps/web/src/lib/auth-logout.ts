import { api } from '#/lib/api'

/**
 * Revokes the current Sanctum token server-side (`AuthController@logout`).
 * Lives in `lib/` because the app shell (sidebar) triggers it and shared code
 * may not import a feature.
 */
export async function revokeSession(): Promise<void> {
  await api.post<unknown>('/api/admin/logout')
}
