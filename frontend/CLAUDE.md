# Project: React Starter Template

## Architecture

Monorepo managed with **pnpm workspaces**. Requires **Node >= 24.15** and **pnpm >= 11**
(enforced via `engines`; `.nvmrc` pins the Node version, and pnpm is activated through corepack).

- `apps/web` — React SPA (`@app/web`): Vite 8 + React 19 + TypeScript 7 + TanStack Router
  (file-based) + TanStack React Query + TanStack React Form + TanStack React Table + Axios + Zod + Pino
- `packages/ui` — Shared UI library (`@app/ui`): shadcn/ui (new-york style) + Radix UI + Tailwind CSS v4 + Lucide icons
- `packages/tsconfig` — Shared TypeScript configs (`base.json`)

### `apps/web/src` layout

```
src/
  routes/        — TanStack file-based routes. Thin: delegate rendering to features/.
  features/      — Domain features only (auth, dashboard, users), plus TEMPLATE-DEFAULTS.
  layouts/       — App shell (AuthedLayout, UnauthedLayout). NOT a feature.
  components/    — Cross-feature shared components (data-table, form, sidebar, …).
  config/        — Environment config, swapped per build mode. The only place that reads import.meta.env.
  lib/           — App infrastructure (api, api-error, logger, log-on-fail, query-client).
  types/         — Cross-feature types (e.g. the API envelope).
```

`features/` holds **domains only**. If something is app shell or infrastructure, it belongs in
`layouts/`, `components/`, or `lib/` — not in `features/`.

### `features/TEMPLATE-DEFAULTS/` — the template's own scaffolding

The one exception to the rule above. It holds what the template ships to be
looked at rather than shipped: currently `components-showcase`, a page
demonstrating every component in the kit.

**It is yours to move, adapt, or delete.** Nothing else imports it, so removing
it breaks nothing — delete the directory, its routes under
`routes/_authed/`, and its entries in `lib/navigation.ts` and both locale files.
Equally, if a piece of it is useful, lift it out into a real feature or into
`components/` and drop the rest.

Two conventions apply inside it and nowhere else:

- **Copy is untranslated.** It is developer-facing, and translating it would put
  a hundred keys into every locale file for a page no end user opens. Anything
  lifted out of here into the real app gets translated on the way.
- **It is uppercase.** The directory is meant to look like scaffolding in a file
  tree, not like a domain someone forgot to name.

Module boundaries are enforced by `scripts/check-module-boundaries.ts`, which
runs before oxlint. A feature may not import another feature, and shared
`components/`, `layouts/`, and `lib/` code may not import any feature. Routes
and `main.tsx` are composition roots and may import feature entry points.

## Critical Rules

### UI Components — shadcn/ui ONLY from `@app/ui`

- **ALWAYS** import UI primitives from `@app/ui/components/*` (e.g., `@app/ui/components/button`,
  `@app/ui/components/input`) — note there is no `ui/` segment
- **ALWAYS** import field wrappers from `@app/ui/components/fields/*` (e.g.
  `@app/ui/components/fields/input`)
- **NEVER** create UI components yourself. If a shadcn/ui component is not installed in `packages/ui`, **ASK the user** to install it manually via `pnpm --filter @app/ui dlx shadcn@latest add <component>`
- Available components: `avatar`, `badge`, `button`, `checkbox`, `collapsible`, `dropdown-menu`, `field`, `input`, `label`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `table`, `tooltip`
- Utility: `@app/ui/lib/utils` (cn helper)
- Hook: `@app/ui/hooks/use-mobile`
- `packages/ui` is **vendored shadcn output**. Don't hand-edit or reformat it; treat it as generated.

Layout follows shadcn's current monorepo convention — `packages/ui/src/{components,hooks,lib,styles}`,
with `components.json` in **both** `packages/ui` and `apps/web`. The app-side one is what lets the CLI
resolve `@app/ui/components` and write there.

Adding a component genuinely works now:

```bash
pnpm --filter @app/ui dlx shadcn@latest add <component>
```

Two layers, both in `packages/ui` so every app shares them:

| Path                          | What lives there                                         | Who writes it                 |
| ----------------------------- | -------------------------------------------------------- | ----------------------------- |
| `@app/ui/components/*`        | shadcn primitives — `button`, `input`, `select`          | the shadcn CLI, never by hand |
| `@app/ui/components/fields/*` | form field wrappers binding a primitive to TanStack Form | us                            |

The `exports` wildcard already covers the nested path — `@app/ui/components/fields/input` resolves
to `packages/ui/src/components/fields/input.tsx`.

Three things the CLI resolves against, all of which must agree or files land in the wrong place:
`packages/ui/package.json` `exports`, `packages/ui/tsconfig.json` `paths`, and the `aliases` in
`components.json`. Getting `exports` wrong silently writes to `packages/ui/components/` instead of
`packages/ui/src/components/`.

### Configuration — `#/config/environment` ONLY

- **NEVER** read `import.meta.env` outside `src/config/`. Nothing else should know
  where configuration comes from.
- **ALWAYS** import `{ environment } from '#/config/environment'`
- Values are Zod-parsed at module load, so a malformed or missing one throws while
  the app is booting and names the field — rather than surfacing later as a
  confusing relative-URL request
- Build mode selects the file: `environment.ts` (dev) · `environment.stg.ts`
  (`--mode staging`) · `environment.prod.ts` (`--mode production`). The swap is a
  mode-keyed `resolve.alias` in `vite.config.ts` — Vite has no equivalent of
  Angular's `fileReplacements`.
- Adding a field means adding it to `environment.schema.ts` **and all three**
  environment files; the schema makes a missing one a boot failure, not a silent
  `undefined`.
- `__BUILD_SHA__` and `__BUILD_TIME__` are injected by `define` and typed in
  `types/build.d.ts`.

### React imports — named, never namespaced

- **NEVER** `import * as React` / `import React`, and never call `React.useState`,
  `React.ReactNode`, `React.ComponentProps`
- **ALWAYS** import what you use: `import { useState, useEffect } from 'react'`,
  `import type { ReactNode, ComponentProps } from 'react'`
- Applies to types as well as values — `ReactNode`, not `React.ReactNode`

### Bundle budget

`pnpm build` runs `scripts/check-bundle-budget.ts` after Vite. It sums raw
JavaScript referenced by the generated `dist/index.html`: the entry module and
every `modulepreload`. It warns above 1 MB and exits non-zero above 1.25 MB.
Lazy route chunks are intentionally excluded; Vite's default 500 kB warning
continues to guard individual chunks. Change these thresholds only as an
explicit performance decision, not to make a failing build green.

### Tests — `node` by default, a DOM only when rendering

Vitest + MSW. Starting a DOM costs more than most of this suite costs to run, so
tests default to the `node` environment and opt into a DOM only when they need
one. The saving is per file, not per test, and it does not shrink as the suite
grows. The current 190 tests use `node` for 17 files and a DOM for only 7.

#### Which environment does a test need?

| The test...                                               | Environment               |
| --------------------------------------------------------- | ------------------------- |
| Calls `render()` / `screen` / RTL                         | **`happy-dom`**           |
| Touches `window`, `document`, or dispatches DOM events    | **`happy-dom`**           |
| Uses `localStorage` or spies on `Storage.prototype`       | `node` — works, see below |
| Makes HTTP calls through MSW                              | `node`                    |
| Parses schemas, exercises pure logic, checks locale files | `node`                    |
| Builds a TanStack Router with `createMemoryHistory`       | `node`                    |

**Default to `node`.** Add a docblock at the very top of the file only when the
table above says so:

```ts
/**
 * @vitest-environment happy-dom
 */
```

#### What the `node` environment actually provides

Confirmed by probing it, not assumed:

```
localStorage  true      window        false
Storage       true      document      false
StorageEvent  false
```

- **`localStorage` and `Storage` work without a DOM.** `src/test/web-storage.ts`
  installs a proxy-backed implementation when the environment has none, so
  `Object.keys(localStorage)`, index access and `vi.spyOn(Storage.prototype, …)`
  all behave. This is not a fidelity compromise: jsdom's `localStorage` is also
  an in-memory shim, and what these tests exercise is our wrapper's logic — key
  ownership, JSON handling, the guards around blocked storage.

- **⚠️ `StorageEvent` does NOT exist in `node`.** This is the one non-obvious
  gap. A test covering **cross-tab sync** — dispatching a `storage` event so
  `syncAcrossTabs()` reacts — must use `happy-dom`, even though it looks like a
  plain storage test. `lib/auth-context.test.tsx` is the existing example.

#### happy-dom vs jsdom

Both are installed. Prefer `happy-dom`: it starts in roughly a third of jsdom's
time and every current test passes on it.

**Treat that as provisional.** Only two files exercise a DOM today, and both are
trivial renders, so happy-dom's surface is barely tested here. It is a
reimplementation, not a spec-complete DOM, and the likely divergence is
**Radix-heavy components** — portals, focus trapping, `getComputedStyle` — which
arrive with the command palette, dialogs and the full field set.

If a component test fails in a way that makes no sense, **switch that one file to
`@vitest-environment jsdom` before assuming the component is broken.** The
docblock is per-file, so this costs one line and affects nothing else.

#### MSW is always on

Both environments, with `onUnhandledRequest: 'error'`. **Do not disable it to
"speed things up".** Without it a stray request reaches the real network and the
suite goes from ~2.1s to **48s** of timeouts. A request with no handler failing
the test is the point.

#### Isolation

`isolate: false` shaves a further ~20% and passes today, but shares module state
between files in a worker — `authStore`, the i18n instance and the in-flight
refresh promise are all module singletons. The hazard is the _next_ test that
mutates one without cleaning up, which produces order-dependent failures. Left
on deliberately.

#### Strictness

Two guarantees, both easy to reintroduce bugs into (see `src/test/setup.ts`):

1. `console.error` during a test fails that test.
2. An HTTP request with no MSW handler fails the test.

Three traps, each of which silently weakens this:

- `vi.spyOn` in `beforeAll` is torn down by `restoreMocks` before every test.
  Hence direct assignment in `beforeEach`.
- Throwing inline from a patched `console.error` is swallowed by whichever
  library called it. Hence recording, then throwing in `afterEach`.
- **`afterEach` hooks run in reverse registration order.** A separate
  `afterEach(cleanup)` is therefore skipped the moment the guard throws, and the
  next test renders into a dirty DOM — producing a cascade of "found multiple
  elements" failures that bury the one real failure. RTL's `cleanup` runs inside
  the guard hook, first, for that reason.

Note what this means for a component test: an unwrapped `act()` warning **fails
the test**. Rendering a `RouterProvider` and asserting immediately will trip it,
because the router settles its first match asynchronously — await something from
the first route before asserting.

#### i18n and router helpers in tests

- `setup.ts` initialises i18next and pins it to `en` for DOM tests. Without it
  `t()` returns the raw key and an assertion on real copy fails for a reason
  that has nothing to do with the component.
- `src/test/router.tsx` exports `renderRouter()` and `TestLink` for tests that
  build their own route tree. `RouterProvider` and `Link` are typed against the
  app's registered routes, so an isolated tree needs a cast — kept in that one
  file rather than scattered across every test.

### Logging — Pino ONLY

- **NEVER** use `console.log`, `console.warn`, `console.error`, or any `console.*` method
- **ALWAYS** use the pino logger from `#/lib/logger` (`import { logger } from '#/lib/logger'`)
- Use appropriate log levels: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
- Pino's error convention is `logger.error({ err }, 'message')` — pass the error under the `err` key
- Levels are `debug` in dev and `error` in production, so only `logger.error()` survives a prod build

### Unawaited promises — `logOnFail`, never `void`

- **NEVER** write `void somePromise()`. It silences the linter without telling anyone when the call
  actually fails, so the rejection disappears.
- **ALWAYS** use `logOnFail` from `#/lib/log-on-fail` for a promise nothing is going to await —
  event handlers, fire-and-forget invalidations, navigation triggered from the UI:

  ```ts
  onClick={() => logOnFail(handleLogout, 'Logout failed')}
  logOnFail(() => refetch(), 'Retry fetching user failed', { userId })
  ```

- It takes a _function_, not a promise, so a synchronous throw is caught too. The optional third
  argument is merged into the pino log object.
- `typescript/no-floating-promises` and `typescript/no-misused-promises` are enabled and will catch
  anything missed.
- When you genuinely need sequencing or a user-facing message, use `try`/`catch` with `await`
  instead — see the post-sign-in navigation in `features/auth/components/sign-in-form.tsx`.

### Error Handling

- **ALWAYS** handle `isError` from `useQuery` — render `<QueryError error={error} onRetry={...} />` from
  `#/components/query-error`. Never let a failed fetch fall through to an empty state, or a network
  failure becomes indistinguishable from "no results".
- **ALWAYS** extract API messages with `getApiErrorMessage(error, fallback)` from `#/lib/api-error`
  rather than reaching into `error.response.data.message` by hand.
- Log failures with `logger.error({ err }, '...')` **before** surfacing them via `toast`.
- Router-level errors fall back to `RouteErrorComponent` / `RouteNotFoundComponent`
  (`#/components/router-error`), wired as `defaultErrorComponent` / `defaultNotFoundComponent` in `main.tsx`.

### Forms — TanStack React Form + shadcn/ui + Zod

- **ALWAYS** use `@tanstack/react-form` with `useForm()` for all forms
- **ALWAYS** write Zod validation schemas in `features/<feature>/validation/<name>.schema.ts`
- Pass schemas via `validators: { onSubmit: mySchema }` on the form config
- Use the shared field wrappers from `@app/ui/components/fields`. All are named
  `<Thing>Field`, to sit apart from shadcn's own `Field` layout primitive:

  | Wrapper            | Value      | Notes                                                          |
  | ------------------ | ---------- | -------------------------------------------------------------- |
  | `InputField`       | `string`   | `type`: `text` \| `number` \| `password` \| `phone` \| `email` |
  | `TextareaField`    | `string`   |                                                                |
  | `SelectField`      | `string`   | dropdown                                                       |
  | `MultiSelectField` | `string[]` |                                                                |
  | `DatePickerField`  | `string`   | ISO `yyyy-mm-dd`, not a `Date`                                 |
  | `RadioGroupField`  | `string`   |                                                                |
  | `SwitchField`      | `boolean`  |                                                                |

- Every wrapper works **bound to a form or standalone**, and nothing else changes:

  ```tsx
  <InputField form={form} name="email" label="Email" type="email" />
  <InputField label="Email" value={email} onChange={setEmail} error={err} />
  ```

- `InputField type="phone"` renders `tel` — `phone` is not a DOM input type.
  `type="number"` still yields a **string**; convert at the boundary like every
  other field.
- Wrap field groups in `<FieldGroup>` from `@app/ui/components/field`
- Field types come from `@app/ui/components/fields` — `AnyReactFormApi`,
  `FieldProps`, `FieldOption`, `InputType`
- **`applyFieldErrors` stays in `apps/web`** (`#/components/form/apply-field-errors`). It reads the
  API error taxonomy from `#/lib/api-error`, and `packages/ui` may not import from an app.
- Form values are **always strings** (that's what inputs and `<select>` produce). Convert to domain
  types in `onSubmit`, not in the field — see _Domain types at boundaries_.
- Omit optional fields rather than sending empty strings (e.g. a blank password means "unchanged",
  so leave it out of the payload entirely).

### Routing — TanStack File-Based Router

- Routes live in `apps/web/src/routes/`
- Auth-protected routes go under `_authed/` directory, public routes under `_unauthed/`
- Route files use `createFileRoute()` and delegate rendering to page components in `features/`
- `staticData` on a route carries its **roles** — see _Authorization_ below
- Search params are validated with Zod schemas via `validateSearch`. Pass the schema directly
  (`validateSearch: mySchema`) — don't wrap it in `(search) => mySchema.parse(search)`.
- **ALWAYS** make search schemas total: give every field a `.catch()` so a malformed URL degrades to
  defaults. A schema that can throw will take the whole route down on a hand-typed or stale URL.

  ```ts
  const usersSearchSchema = z.object({
    page: z.coerce.number().int().positive().optional().catch(undefined),
    search: z.string().optional().catch(undefined),
  })
  ```

### Feature Organization

- **ALWAYS** organize new features under `apps/web/src/features/<feature-name>/`
- Standard feature structure:
  ```
  features/<feature>/
    api/          — API calls (using axios instance from #/lib/api)
    components/   — Feature-specific components
    pages/        — Page components (*.page.tsx)
    types/        — TypeScript types (a directory with index.ts, not a bare types.ts)
    validation/   — Zod schemas (*.schema.ts)
    config/       — Feature config (table configs, etc.)
  ```
- Only create subdirectories that are needed for the feature
- Domain-specific React context lives at the feature root. App-wide
  infrastructure such as the auth provider lives in `lib/` so shared shell
  components can consume it without depending on a feature.
- `features/TEMPLATE-DEFAULTS/` is not a domain and does not follow this rule —
  it is the template's own scaffolding, to keep or delete. See _`apps/web/src`
  layout_ above.

## Path Aliases

Each alias has exactly one meaning — they are **not** interchangeable.

- `#/*` — maps to `apps/web/src/*`. **Always use this inside `apps/web`.**
- `@/*` — maps to `packages/ui/src/*`. Reserved for `packages/ui`'s own internals. Never use it
  inside `apps/web`.
- `@app/ui/*` — maps to `packages/ui/src/*`. Use this to import UI components **from `apps/web`**.
  Generated components import each other through it too.

Vite resolves these natively from `tsconfig.json` via `resolve.tsconfigPaths` (Vite 8+) — there is no
`vite-tsconfig-paths` plugin.

## Key Patterns

### API Layer

- HTTP client: `apps/web/src/lib/api.ts` — Axios instance with Bearer token interceptor
- API base URL: `import.meta.env.VITE_API_URL` (set it in `apps/web/.env`)
- Feature API files: `features/<feature>/api/<name>.api.ts`
- API functions always strip axios's own `response.data` layer — callers never see an `AxiosResponse`:
  - single-resource endpoints also unwrap the `{ data: T }` envelope and return `T`
    (`fetchUser` → `response.data.data` → `User`)
  - list endpoints return `PaginatedResponse<T>`, so the caller reads `.data` and `.pagination`
- API functions take and return **domain types** (see _Domain types at boundaries_)
- Server state: TanStack React Query (`queryClient` in `#/lib/query-client`)
- Shared envelope types (`PaginatedResponse`, `Pagination`) live in `#/types/api`
- The backend uses `snake_case`; those names are kept as-is on the wire types rather than remapped

### Domain types at boundaries

Strings enter the app from URLs and form fields; the domain uses real types. Convert **once**, at the
boundary, with a validating parser — never scatter `Number(x)` or `as SomeEnum` around.

```ts
// features/users/types/index.ts
export function parseUserRole(value: string | number | undefined): UserRole | undefined
```

API payload types use the domain type (`role_id: UserRole`), and the caller parses before mutating.
An unparseable value is a user-facing error, not a cast.

### Auth

- `AuthProvider` / `useAuth()` in `#/lib/auth-context` — token + user in localStorage
- Route guard via `beforeLoad` in `_authed.tsx` layout route
- Known gap: `isAuthenticated` reflects only whether a token is _present_, not whether it is _valid_.
  `expires_in` from the login response is ignored and there is no 401 response interceptor, so an
  expired token still reads as signed-in.

### Layouts

Layouts are the app shell, not a domain feature, so they live at `src/layouts/` rather than under `features/`.

- `AuthedLayout` (`layouts/authed-layout.tsx`) — sidebar + header + content
- `UnauthedLayout` (`layouts/unauthed-layout.tsx`) — public pages

### Navigation — one registry, roles read from the routes

`#/lib/navigation.ts` is the single list of what the shell can navigate to. The
sidebar (`components/sidebar/`) and the command palette both render from it.

- An entry carries `to`, `titleKey` and `icon` — **not roles.** Roles live on the
  route's `staticData` and are read back out of the router by `canAccessPath`
  (`#/lib/route-guard`), which runs the same check `_authed`'s `beforeLoad` runs.
  Duplicating roles into a menu drifts, and both directions are bad: a visible
  link that bounces, or a page a user can reach but never sees.
- `NavPath` excludes `$param` paths at the type level, so `/users/$userId` cannot
  be put in a menu that has nothing to fill the param from.
- `useVisibleNavigation()` (`components/sidebar/use-navigation.ts`) returns the
  filtered groups. A group whose items are all hidden is dropped — a heading over
  an empty list reads as a loading failure.
- Adding a destination is one entry plus a `nav.*` locale key in **both** locale
  files. Nothing else changes.

### Command palette

`#/components/command-palette.tsx`, mounted in `AuthedLayout`, opens on ⌘K /
Ctrl+K over the same registry.

- This shadcn `CommandDialog` renders children straight into `DialogContent`
  **without a `<Command>` of its own**, so the caller has to supply one. Omitting
  it throws inside cmdk with a bare "cannot read properties of undefined".

### Unsaved-changes guard

`useUnsavedChanges(isDirty)` from `#/components/unsaved-changes`, inside the
`UnsavedChangesProvider` that `AuthedLayout` mounts.

- Pass the live dirty flag; it is watched, so a form that saves stops blocking
  without unmounting.
- Dirty forms are tracked as a set of ids, not a boolean — two dirty forms on one
  page must not clear each other's flag.
- The router blocker only sees router navigation; closing the tab is covered
  separately by `beforeunload`, whose prompt the browser words itself.

### Focus management

`useFocusOnNavigate()` from `#/lib/use-focus-on-navigate`, applied to the `<main>`
in both layouts with `tabIndex={-1}`. SPA navigation does not reset focus, so
without it Tab resumes from wherever the previous page left off. It deliberately
skips the first render, which would otherwise fight autofocus on the sign-in
field.

### Page Header

- Use `<PageHeader title="..." description="..." actions={...} />` from `#/components/page-header`

### Data Tables

- Use the `DataTable` component from `#/components/data-table`
- Column configs go in `features/<feature>/config/<name>-table-config.tsx`
- `DataTableConfig<TData>` is generic over the row type — `searchColumn` is constrained to real keys of `TData`
- For server-driven tables set `manualPagination` / `manualFiltering`, and pass `pageCount`,
  `totalRows`, and `pageSize` from the server's `pagination` rather than assuming a page size
- Pass `isLoading` (not `isFetching`) — with `placeholderData: keepPreviousData`, `isFetching` is true
  on every background refetch and would flash skeletons over good rows
- URL is the source of truth for table state via `useDataTableFilters`
- CSV export is a backend operation. Call `openDownload()` from
  `#/lib/open-download` with the unauthenticated export path and active filters;
  it opens the backend URL in a `noopener,noreferrer` window. The backend owns
  CSV generation, filename and download response headers. Never generate CSV
  from `table.getRowModel()` — that contains only the visible page.
- Enable backend export formats independently with `config.exports.csv`,
  `.excel`, and `.pdf`; each is `{ enabled }`. All three formats export the
  active filters through the same backend route and a
  `format=csv|excel|pdf` query parameter.
- Pass `renderBulkActions` to expose actions when rows are selected. It receives
  the selected domain rows and `clearSelection`; the table owns the selection UI.
- Supply `config.getRowId` for server-driven selection. Array indexes identify
  positions on a page, not records, and therefore cannot safely survive paging.

### Authorization — roles on routes

- Declare who may reach a route in its `staticData`:

  ```ts
  export const Route = createFileRoute('/_authed/users/')({
    staticData: { roles: [UserRole.SuperAdmin, UserRole.Admin] },
  })
  ```

- Omitting `roles` means **any signed-in user**. An empty `roles: []` fails
  closed and lets nobody through, so a typo cannot silently open a route.
- Enforcement is central, in `_authed`'s `beforeLoad` — a layout route can see
  the `staticData` of children matched below it, so a new protected route is
  covered by declaring roles rather than by remembering to add a guard.
- Restrictions **intersect** down the chain: a child cannot widen what a parent
  restricted.
- A failed check redirects to `/forbidden`.

## Commands

- `pnpm dev` — Start dev server on port 3000
- `pnpm build` — Build for production
- `pnpm typecheck` — Typecheck every package (`tsc --noEmit`)
- `pnpm lint` — Run oxlint with type-aware rules (`oxlint --type-aware`, config in
  `apps/web/.oxlintrc.json`). Only `apps/web` has a lint script; `packages/ui` is vendored and not
  linted. Also runs on **pre-commit** via husky. ESLint is not used — see
  `docs/toolchain-research.md`.
- `pnpm test` — Run tests (vitest)
- `pnpm changelog` — Regenerate `CHANGELOG.md` from Conventional Commits using
  the pinned git-cliff configuration
- `pnpm verify` — Run typecheck, lint, tests, production build, dependency
  audit, and formatting
- `pnpm --filter @app/ui dlx shadcn@latest add <component>` — Add shadcn component to UI package

### Formatting

Prettier runs **once from the repo root**, not per package — one `.prettierrc` and one
`.prettierignore` govern everything, and there are no per-package prettier configs to drift.

- `pnpm format` — `prettier --check .`
- `pnpm format:fix` — `prettier --write .`
- `pnpm check` — format everything, then `oxlint --fix`

`.prettierignore` excludes build output, `apps/web/src/routeTree.gen.ts` (regenerated on every
dev-server start), and **all of `packages/ui`** — it is vendored shadcn output and is never
reformatted.

## Verifying changes

Before considering work done, run:

```bash
pnpm verify
```

`pnpm test` runs the full Vitest suite. When a change touches behaviour that is
tested, break the code deliberately and confirm a test fails — a test that passes
either way is documentation, not a check.

## Committing and pushing

Hooks are wired through husky in `.husky/`; what runs against staged files is
configured in `.lintstagedrc.mjs`.

- **pre-commit** — module boundaries, then, over the staged files only: oxlint,
  a whole-program typecheck with untracked files excluded
  (`scripts/typecheck-staged.mjs`), the tests covering those files, and
  prettier. Sequential, because prettier rewrites files the other tasks read.
- **commit-msg** — commitlint. Conventional Commits, enforced.
- **pre-push** — `pnpm typecheck` and the full suite. Neither can be scoped to
  a change, so they run once per push rather than once per commit.

### Always report how long a commit or a push took

Time every `git commit` and `git push`, and state the elapsed seconds in the
reply. The hooks sit between an edit and a commit, so they are the first thing
to grow without anyone noticing; a number in every report is what makes a
regression visible. Report the real elapsed time, including a run that was
slower than usual — an averaged or remembered figure is worth nothing here.

Measured on the reference machine, August 2026:

| Commit                                                       |      |
| ------------------------------------------------------------ | ---- |
| Locale files only                                            | 1.3s |
| Module whose directory has too many tests (deferred to push) | 2.0s |
| Module with a sibling node test                              | 3.3s |
| Module with a sibling DOM test                               | 4.1s |
| Component + its test + both locales                          | 5.0s |

A push is ~12s cold, and near-instant when turbo's cache still holds.
