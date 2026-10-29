# SparkyLink

Interni softver firme **Cekić Elektrik** za vođenje gradilišta. Za svako gradilište beleži koliko
je firma platila (materijal, radnici, ostali troškovi), koliko naplaćuje investitoru i kolika je
zarada. Investitoru daje PDF ponudu ili završni račun na kome vidi samo ono što duguje. Svi iznosi
se vode **u evrima i u dinarima**, po srednjem kursu NBS na dan stavke. Radi na računaru i na
telefonu (PWA, dodaje se na početni ekran).

Softver je interni: nema PDV-a, SEF-a ni fiskalizacije, a PDF je obračun, ne poreska faktura.

## Šta radi

- **Gradilišta**: investitor i kontakt, adresa, status (ponuda – čeka odgovor / otvoreno / zatvoreno),
  valuta obračuna, marža; pretraga, filteri, istorija (brisanje se može poništiti).
- **Stavke**: materijal (nabavna i cena za investitora), usluge i ostali troškovi, u RSD ili EUR;
  predlozi iz cenovnika, zbirovi, pretraga i filter po izvoru stavke.
- **Fiskalni računi**: QR kod (kamera, slika računa ili link), pa stavke računa ulaze kao materijal.
  Račun ostaje sačuvan za garanciju (PDF kopija, pretraga svih računa).
- **Uvoz iz Excel-a**: predračun prodavnice (`.xls`/`.xlsx`) postaje stavke. Izmenjena verzija istog
  predračuna se prepoznaje i ažurira postojeće stavke, umesto da ih duplira.
- **Nabavna cena naknadno**, zbirno za ceo uvoz: popust u procentima ili ukupno plaćeni iznos,
  raspoređen srazmerno.
- **Radnici** (trošak: radnici × sati × cena sata) i **uplate investitora**; dug i status naplate se
  računaju sami.
- **Ponuda i završni račun**: PDF sa logom i podacima firme, čuva se kao snimak i nikad ne prikazuje
  nabavne cene ni zaradu.
- **Raspored osigurača**: za svaku tablu (ormar) spisak osigurača sa rednim brojem, šta napaja,
  jačinom i tipom (B/C). PDF (A4 položeno) u jednom od četiri izgleda pravi se kad zatreba.
- **Slike i video** sa gradilišta, **napomene**, **cenovnik**.
- **Pregled finansija**: naplata, troškovi, zarada i uplate za period, dužnici, zarada po mesecima,
  najisplativija gradilišta.
- **Jedan nalog**: samo vlasnik; nema uloga ni dodavanja korisnika.

Kako sve to radi i po kojim pravilima: [`docs/SISTEM.md`](docs/SISTEM.md).

## Delovi i dokumentacija

| Deo | Šta je |
|---|---|
| `backend/` | Laravel 12 API (PHP 8.4, MySQL 8.4, Sanctum), šablon Larastarter |
| `frontend/` | React 19 SPA (Vite, TanStack, shadcn/ui, Tailwind 4), PWA; pnpm monorepo |
| `docker-compose.yml` | ceo stek za server (Portainer + Traefik) |
| `docker-compose.override.yml` | samo lokalno: sopstveni Traefik, portovi, alati za razvoj |
| `docker/` | MySQL (pravi test bazu), rezervne kopije, lokalni Traefik |

| Dokument | Za šta |
|---|---|
| [`docs/SISTEM.md`](docs/SISTEM.md) | kako sistem radi: nalog, tokovi, novac i kurs, tabele |
| [`docs/API.md`](docs/API.md) | sve rute API-ja |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | postavljanje na server, ažuriranje, rezervne kopije, kad nešto ne radi |
| [`CLAUDE.md`](CLAUDE.md) | brzo snalaženje u kodu: komande, arhitektura, zamke |
| [`backend/CLAUDE.md`](backend/CLAUDE.md), [`frontend/CLAUDE.md`](frontend/CLAUDE.md) | pravila pisanja koda (šabloni) |
| [`docs/superpowers/specs/2026-10-26-sparkylink-design.md`](docs/superpowers/specs/2026-10-26-sparkylink-design.md) | prvobitna specifikacija i odluke (26.10.2026) |

## Lokalno pokretanje

Potreban je samo Docker (PHP i Node se ne instaliraju; alati rade u kontejnerima).

```bash
docker network create proxy          # jednom (ista mreža kao na serveru)
cp .env.example .env                 # popuni APP_KEY i lozinke; APP_DOMAIN=localhost
docker compose up -d --build
docker compose exec sparky-api php artisan db:seed --force   # probni podaci (po želji)
```

- Računar: **http://localhost**
- Telefon na istoj Wi-Fi mreži: **http://<IP računara>** (npr. `http://192.168.31.204`)
- Jedini nalog: `ADMIN_EMAIL` / `SECRET_PASSWORD` iz `.env` (lozinka se menja u profilu)
- Probni podaci samo lokalno, ručno (`php artisan db:seed`): tri gradilišta sa stavkama, radom i uplatama
- Traefik kontrolna tabla: http://localhost:8090

Kamera uživo za QR kod radi samo preko HTTPS-a (produkcija, ili lokalno `https://<IP računara>` uz
upozorenje pregledača). Preko HTTP-a račun se **slika** (dugme „Slikaj račun“) i QR se čita sa slike.

## Razvoj i provere

```bash
# Backend (kod sa hosta, vendor u volumenu)
docker compose run --rm sparky-dev composer install
docker compose run --rm sparky-dev php artisan test

# Frontend (node_modules u volumenima)
docker compose run --rm --no-deps sparky-node pnpm install
docker compose run --rm --no-deps sparky-node sh -c "cd apps/web && npx tsc --noEmit && npx oxlint --type-aware && npx vitest run && pnpm build"
docker compose --profile tools up sparky-node      # Vite dev server: http://localhost:3000 (API ide kroz sparky-web)
```

Aplikacija na http://localhost radi iz izgrađenog image-a, pa se posle izmene koda osvežava sa
`docker compose up -d --build`. Pokretanje jednog testa i ostale komande: [`CLAUDE.md`](CLAUDE.md).

Rad ide na grani `develop`; server prati `master` ([`DEPLOYMENT.md`](DEPLOYMENT.md)).
