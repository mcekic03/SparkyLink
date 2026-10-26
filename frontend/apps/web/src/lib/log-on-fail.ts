import { logger } from './logger'

export function logOnFail(
  fn: () => Promise<unknown>,
  message: string,
  context?: Record<string, unknown>,
): void {
  try {
    fn().catch((err: unknown) => {
      logger.error({ err, ...context }, message)
    })
    // catch for synchronous errors
  } catch (err) {
    logger.error({ err, ...context }, message)
  }
}
