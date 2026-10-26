# React Starter Template

A production-ready React starter template with a monorepo architecture, featuring authentication, user management, data tables, and a comprehensive UI component library.

## Tech Stack

- **React 19** with **TypeScript 7**
- **Vite 8** — build tool with HMR
- **TanStack Router** — file-based routing with code splitting
- **TanStack Query** — server state management
- **TanStack Form** — form state with Zod validation
- **TanStack Table** — headless data tables
- **Tailwind CSS 4** — utility-first styling
- **shadcn/ui** — accessible UI components built on Radix UI
- **Axios** — HTTP client with auth interceptors
- **Pino** — structured logging
- **oxlint + tsgolint** — type-aware linting, Prettier for formatting
- **react-i18next** — English and Serbian, with typed keys
- **next-themes** — light / dark / system
- **Turborepo** — task caching across the workspace
- **Vitest + MSW** — 190 tests; `node` environment by default, a DOM only where needed

## Project Structure

```
├── apps/
│   └── web/                    # Main React application
│       └── src/
│           ├── routes/         # File-based routing (TanStack Router)
│           ├── features/       # Domain features (auth, users, dashboard)
│           ├── layouts/        # App shell
│           ├── components/     # Cross-feature components (data-table, sidebar)
│           ├── config/         # Environment config, swapped per build mode
│           ├── lib/            # Infrastructure (api, auth, logger, i18n)
│           ├── locales/        # en.json / sr.json
│           ├── test/           # Vitest setup, MSW handlers
│           └── types/          # Cross-feature types
├── packages/
│   ├── ui/
│   │   └── src/
│   │       ├── components/     # shadcn primitives + fields/ wrappers
│   │       ├── hooks/
│   │       ├── lib/            # cn helper
│   │       └── styles/         # globals.css
│   └── tsconfig/               # Shared TypeScript configurations
```

### Where new code goes

- Put a domain capability in `apps/web/src/features/<feature>/`, with its API,
  pages, components, validation, types, and configuration kept inside that
  feature.
- Put reusable application components in `apps/web/src/components/` and
  application infrastructure in `apps/web/src/lib/`.
- Keep route files thin in `apps/web/src/routes/`; they should validate routing
  concerns and delegate rendering to feature pages.
- Put app-shell composition in `apps/web/src/layouts/`, shared wire/domain types
  in `apps/web/src/types/`, and environment definitions in
  `apps/web/src/config/`.
- Add reusable UI primitives and field wrappers to `packages/ui/`.

Lint enforces these boundaries: features cannot import other features, and
shared `components`, `layouts`, and `lib` code cannot depend on a feature.

## Features

- **Authentication** — bearer tokens with expiry, silent refresh and replay, a
  401/403 interceptor, and cross-tab sign-out
- **Authorization** — per-route roles declared in `staticData`, enforced centrally,
  with a 403 page
- **User Management** — list, search, filter, and edit users
- **Data Tables** — sortable, filterable, paginated tables with URL-driven state,
  backend-generated CSV/Excel/PDF export, and reusable bulk actions
- **Sidebar Navigation** — generated from one typed route registry and filtered
  by role, so a link can never disagree with the guard behind it
- **Command Palette** — ⌘K / Ctrl+K, over the same registry
- **Unsaved-changes guard** — global; blocks router navigation and warns on tab close
- **Toast Notifications** — via Sonner
- **Structured Logging** — pino, with `logOnFail` for unawaited promises
- **i18n** — react-i18next with English and Serbian, typed keys
- **Dark mode** — light / dark / system, via next-themes
- **Field wrappers** — seven `<Thing>Field` components usable bound to a form or standalone
- **Typed API layer** — responses parsed at the boundary, a discriminated error
  taxonomy, and 422s painted onto the fields that caused them

### Known gaps

A work in progress — `docs/implementation-plan.md` tracks the build-out. What is
still missing:

- **No deploy story.** No Dockerfile, nginx config, or CI pipeline — deliberately
  deferred.
- **No self-registration.** Deliberate — users are created by an admin. The
  sign-up page has been removed rather than left dead.
- **Password reset is not implemented** — the endpoints are unknown.
- **The token refresh contract is assumed, not confirmed** — see the TODO in
  `lib/auth-refresh.ts`. Everything around it is contract-independent.

## Getting Started

### Prerequisites

- Node.js 24.15+ (see `.nvmrc`)
- pnpm 11+

### Installation

```bash
pnpm install
```

### Configuration

Configuration lives in `apps/web/src/config/`, not `.env` files — see `CLAUDE.md`.
The default (`environment.ts`) points at:

```ts
appName: 'React Starter (dev)'
apiUrl: 'http://localhost:8000'
```

`appName` is what the sidebar and sign-in page show; each build mode sets its own,
so a staging deploy is identifiable at a glance.

### Development

```bash
pnpm dev
```

Runs the dev server at [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
```

The production build measures entry and module-preloaded JavaScript. It warns
above 1 MB raw and fails above 1.25 MB; lazy route chunks are excluded.

### Testing

```bash
pnpm test        # 190 tests, ~9s
pnpm --filter @app/web test:watch
```

Tests default to the `node` environment; only files that render opt into a DOM
with an `@vitest-environment happy-dom` docblock. The current suite has 17 node
files and 7 DOM files. See `CLAUDE.md` for which tests need a DOM.

### Linting & Formatting

```bash
pnpm lint        # module boundaries + type-aware oxlint; also runs on pre-commit
pnpm lint:fix    # oxlint --fix
pnpm format      # prettier --check, from the repo root
pnpm format:fix  # prettier --write
pnpm check       # format:fix, then lint:fix
```

Prettier runs once from the root — one `.prettierrc` and one `.prettierignore` for the whole
workspace. `packages/ui` is excluded as vendored output.

### Verifying changes

```bash
pnpm verify
```

The full gate runs typechecking, lint, tests, the production build and bundle
budget, a registry-backed `pnpm audit`, and the formatting check. Audit uses
pnpm's default `low` threshold, so every reported advisory fails verification.

### Changelog

```bash
pnpm changelog                 # refresh the Unreleased section
pnpm changelog --tag v1.0.0    # render unreleased commits as a release
```

The checked-in changelog is generated from Conventional Commits by git-cliff.
Release tags must match `v<major>.<minor>.<patch>`.

## Routes

| Path         | Description                              |
| ------------ | ---------------------------------------- |
| `/`          | Home page (unauthenticated)              |
| `/sign-in`   | Login page                               |
| `/dashboard` | Dashboard (authenticated)                |
| `/users`     | Users list, search, filters (admin only) |
| `/users/:id` | Edit user (admin only)                   |
| `/forbidden` | Shown when a role check fails            |

## Adding a New Feature

1. Create a feature directory in `apps/web/src/features/<feature>/`
2. Add route files in `apps/web/src/routes/_authed/<feature>/`
3. Declare route access with `staticData: { roles: [...] }` if it should be restricted
4. Import primitives from `@app/ui/components/*` and field wrappers from
   `@app/ui/components/fields`
5. Add user-visible strings to `src/locales/en.json` and `sr.json` — keys are
   typed, so a missing one is a compile error

## Adding UI Components

```bash
pnpm --filter @app/ui dlx shadcn@latest add <component>
```

Runs from anywhere in the repo. Components land in `packages/ui/src/components/`
and are imported as `@app/ui/components/<component>`.

`packages/ui` is vendored output — never hand-edit it; re-run the CLI instead.

## Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Start dev server                                 |
| `pnpm build`      | Production build                                 |
| `pnpm preview`    | Preview production build                         |
| `pnpm typecheck`  | Typecheck every package                          |
| `pnpm lint`       | Run oxlint (type-aware). Also runs on pre-commit |
| `pnpm test`       | Run tests (Vitest, via Turborepo)                |
| `pnpm format`     | Check formatting (Prettier, from root)           |
| `pnpm format:fix` | Fix formatting                                   |
| `pnpm changelog`  | Regenerate CHANGELOG.md from Git history         |
| `pnpm verify`     | Run the complete verification and security gate  |
| `pnpm check`      | Format, then lint --fix                          |
