# SparkyLink – web (frontend)

React SPA za SparkyLink (Cekić Elektrik): gradilišta, stavke, rad, uplate, ponude i završni računi,
raspored osigurača, skeniranje fiskalnih računa, uvoz stavki iz Excel-a, slike i video, napomene,
pregled finansija.
PWA – instalira se na telefon. Kako sistem radi: [../docs/SISTEM.md](../docs/SISTEM.md).

- Pravila za rad na kodu: [CLAUDE.md](CLAUDE.md) (šablon react-starter, [docs/TEMPLATE.md](docs/TEMPLATE.md))
- API: [../docs/API.md](../docs/API.md) – na istom domenu kao sajt (`/api`)
- Pokretanje i provere: [../README.md](../README.md)

Stack: React 19, TypeScript 7, Vite 8, TanStack Router / Query / Form / Table, Zod, shadcn/ui + Tailwind 4,
i18next (sr/en), Vitest + MSW, zxing-wasm (QR kod sa fiskalnog računa). pnpm monorepo:
`apps/web` (aplikacija), `packages/ui` (komponente).
