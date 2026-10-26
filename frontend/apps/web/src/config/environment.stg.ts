import { defineEnvironment, sameOrigin } from './environment.schema'
import type { Environment } from './environment.schema'

/** API je na istom domenu kao stranica (lokalno, IP racunara ili produkcija). */
export const environment = defineEnvironment({
  production: true,
  appName: 'SparkyLink (test)',
  apiUrl: sameOrigin(),
  authStrategy: 'bearer',
} satisfies Environment)
