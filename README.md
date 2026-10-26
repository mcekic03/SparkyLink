# SparkyLink

Interni softver firme **Cekić Elektrik** za vođenje gradilišta: materijal (nabavna i prodajna cena),
usluge, rad radnika, uplate investitora, ponude i završni računi (PDF), fiskalni računi sa
skeniranjem QR koda i čuvanjem za garanciju, slike i video snimci, napomene. Svi iznosi u
**evrima i dinarima** (srednji kurs NBS na dan stavke).

| Deo | Šta je | Smernice |
|---|---|---|
| `backend/` | Laravel 12 API (PHP 8.4, MySQL 8.4, Sanctum) – Larastarter šablon | [`backend/CLAUDE.md`](backend/CLAUDE.md) |
| `frontend/` | React 19 SPA (Vite, TanStack, shadcn/ui), PWA – React šablon | [`frontend/CLAUDE.md`](frontend/CLAUDE.md) |
| `docker-compose.yml` | ceo produkcioni stek (Portainer + Traefik) | [`DEPLOYMENT.md`](DEPLOYMENT.md) |
| `docker-compose.override.yml` | lokalno: sopstveni Traefik, portovi, alati | ovaj fajl |

Specifikacija: [`docs/superpowers/specs/2026-10-26-sparkylink-design.md`](docs/superpowers/specs/2026-10-26-sparkylink-design.md) ·
API: [`docs/API.md`](docs/API.md)

## Lokalno pokretanje

```bash
docker network create proxy          # jednom (ista mreža kao na serveru)
cp .env.example .env                 # popuni APP_KEY, lozinke; APP_DOMAIN=localhost
docker compose up -d --build
docker compose exec sparky-api php artisan db:seed --force   # probni podaci (po želji)
```

- Računar: **http://localhost**
- Telefon na istoj Wi-Fi mreži: **http://<IP računara>** (npr. `http://192.168.31.204`)
- Prvi i jedini nalog koji se pravi sam: `ADMIN_EMAIL` / `SECRET_PASSWORD` iz `.env` (lozinka se menja u profilu)
- Probni podaci samo lokalno, ručno (`php artisan db:seed`): tri gradilišta i radnik `radnik@sparkylink.rs` sa istom lozinkom
- Traefik kontrolna tabla: http://localhost:8090

Kamera uživo za QR kod radi samo preko HTTPS-a (produkcija). Lokalno preko IP adrese
skeniranje radi tako što se račun **slika** (dugme „Slikaj račun“) – QR se čita sa slike.

## Razvoj i provere

```bash
# Backend (vendor je u volumenu, kod sa hosta)
docker compose run --rm sparky-dev composer install
docker compose run --rm sparky-dev php artisan test

# Frontend (node_modules u volumenima)
docker compose run --rm --no-deps sparky-node pnpm install
docker compose run --rm --no-deps sparky-node sh -c "cd apps/web && npx tsc --noEmit && npx oxlint --type-aware && npx vitest run && npx vite build"
docker compose --profile tools up sparky-node      # Vite dev server: http://localhost:3000 (API ide kroz sparky-web)
```

Posle izmene koda lokalni stek se osvežava sa `docker compose up -d --build`.

## Kako radi novac

- Svaka stavka, rad i uplata čuva valutu unosa, **kurs tog dana** i **oba iznosa** – promena kursa
  kasnije ne menja stare obračune.
- Kurs: `kurs.resenje.org` (podaci NBS), sam se preuzima svakog jutra; može i ručno (Podešavanja).
- Gradilište ima valutu obračuna; dug investitora se računa u njoj, druga valuta po današnjem kursu.
- Status naplate (nije plaćeno / delimično / u celosti) računa se sam iz naplate i uplata.
