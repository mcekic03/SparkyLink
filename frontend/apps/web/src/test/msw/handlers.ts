import { http, HttpResponse } from 'msw'
import { environment } from '#/config/environment'

const API = environment.apiUrl

/** Happy path only. Failures belong in the test that asserts them, via server.use(). */
export const handlers = [
  http.get(`${API}/api/admin/users`, () =>
    HttpResponse.json({
      data: [],
      pagination: { total: 0, per_page: 15, current_page: 1, total_pages: 1 },
    }),
  ),
]
