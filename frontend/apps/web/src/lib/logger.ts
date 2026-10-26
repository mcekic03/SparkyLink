import pino from 'pino'
import { environment } from '#/config/environment'

export const logger = pino({
  // 'silent' in production would discard errors too — keep `error` so real
  // failures remain visible (and forwardable to a collector later).
  level: environment.production ? 'error' : 'debug',
  browser: {
    asObject: false,
  },
})
