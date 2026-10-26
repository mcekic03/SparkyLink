import { defineEnvironment, sameOrigin } from './environment.schema'
import type { Environment } from './environment.schema'

/** API je na istom domenu kao stranica (lokalno, IP racunara ili produkcija). */
export const environment = defineEnvironment({
  production: false,
  appName: 'SparkyLink (dev)',
  apiUrl: sameOrigin(),
  authStrategy: 'bearer',
} satisfies Environment)
