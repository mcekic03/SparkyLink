import { i18n } from '#/lib/i18n'
/** The narrow slice of i18next's `t` this needs, so callers and tests can pass
 * a plain function without casting. */
type Translate = (key: string, options: { defaultValue: string }) => string

export interface EnumOption<TValue> {
  value: TValue
  label: string
}

/**
 * Turns a numeric enum's values into translated `<select>` options.
 *
 * Replaces hand-maintained label maps, which sit beside the enum and silently
 * drift when a member is added — the label lookup just returns undefined.
 * Here a missing key is visible in the locale file instead.
 *
 * `keyPrefix` is a translation path whose children are keyed by enum value,
 * e.g. `users.roles` with `{ "1": "Super Admin" }`.
 */
export function enumOptions(
  enumObject: Record<string, string | number>,
  keyPrefix: string,
  translate: Translate = i18n.t,
): Array<EnumOption<number>> {
  // Numeric enums carry reverse string keys too, so filter down to the values.
  const values = Object.values(enumObject).filter(
    (value): value is number => typeof value === 'number',
  )

  return values.map((value) => {
    // Built at runtime, so the typed-key checking in types/i18next.d.ts cannot
    // apply. The defaultValue makes a missing key show as the key itself
    // rather than an empty label.
    const key = `${keyPrefix}.${value}`
    return { value, label: translate(key, { defaultValue: key }) }
  })
}
