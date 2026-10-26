import z from 'zod'

/**
 * Only same-origin paths are accepted. A protocol-relative value like
 * `//evil.com` is a valid URL to the browser, so rejecting it here keeps
 * `?redirect=` from being usable as an open redirect.
 */
const internalPath = z
  .string()
  .refine((value) => value.startsWith('/') && !value.startsWith('//'))

export const signInSearchSchema = z.object({
  redirect: internalPath.optional().catch(undefined),
})

export type SignInSearch = z.infer<typeof signInSearchSchema>
