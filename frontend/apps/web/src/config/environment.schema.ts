import { z } from 'zod'

const environmentSchema = z.object({
  production: z.boolean(),

  /** Shown in the sidebar; per-deploy so staging is identifiable at a glance. */
  appName: z.string().min(1),

  /**
   * SparkyLink serves the SPA and the API from the same origin (nginx in
   * sparky-web forwards /api), so this is the page's own origin. No trailing
   * slash — axios joins paths itself and would produce `//api`.
   */
  apiUrl: z.url().refine((value) => !value.endsWith('/'), {
    message: 'must not end with a trailing slash',
  }),

  authStrategy: z.enum(['bearer']),
})

export type Environment = z.infer<typeof environmentSchema>

export function defineEnvironment(value: unknown): Environment {
  const result = environmentSchema.safeParse(value)

  if (!result.success) {
    const problems = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n')

    throw new Error(
      `Invalid environment configuration:\n${problems}\n\n` +
        'Fix the environment file for this build mode under src/config/.',
    )
  }

  return result.data
}

/** The page's own origin; tests without a DOM fall back to localhost. */
export function sameOrigin(): string {
  return typeof window === 'undefined'
    ? 'http://localhost'
    : window.location.origin
}
