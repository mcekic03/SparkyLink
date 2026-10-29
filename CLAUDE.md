# CLAUDE.md

Ovaj fajl daje smernice Claude Code-u (claude.ai/code) za rad sa kodom u ovom repozitorijumu.

**SparkyLink** (ne „MS“ ni „sparky“) je interni softver firme Cekić Elektrik za gradilišta:
Laravel 12 API (`backend/`) + React 19 SPA (`frontend/`), sve u jednom Docker steku.

| Pitanje | Gde |
|---|---|
| Šta sistem radi i po kojim pravilima (nalog, tokovi, novac, tabele) | [`docs/SISTEM.md`](docs/SISTEM.md) |
| Rute API-ja | [`docs/API.md`](docs/API.md) |
| Server, ažuriranje, rezervne kopije | [`DEPLOYMENT.md`](DEPLOYMENT.md) |
| Pravila pisanja backend koda (obavezna) | [`backend/CLAUDE.md`](backend/CLAUDE.md) – Larastarter |
| Pravila pisanja frontend koda (obavezna) | [`frontend/CLAUDE.md`](frontend/CLAUDE.md) – React šablon |

## Pravila rada

- Sve na srpskom, ekavicom: komunikacija, dokumentacija, komentari u kodu (i u frontendu), prevodi,
  commit poruke. Engleski samo u identifikatorima, imenima fajlova i komandama.
- `git commit`, `push`, `pull` i `merge` samo na izričit zahtev vlasnika, bez potpisa alata.
  Radna grana je `develop`; server (Portainer) prati `master`, koji se pomera na `develop` tek po nalogu.
- Husky i commitlint iz frontend šablona ovde nisu postavljeni (git koren je ovaj folder), pa se
  provere puštaju ručno, pre svakog commit-a.

## Komande

PHP-a na računaru nema, a Node na računaru je stariji od traženog (≥ 24.15). Zato se svi alati
pokreću kroz Docker, iz korena repozitorijuma (`-T` je potreban kad nema terminala, npr. u alatu Bash).

```bash
docker network create proxy                       # jednom
docker compose up -d --build                      # ceo stek: http://localhost, telefon http://<IP računara>
docker compose build sparky-api sparky-web && docker compose up -d   # posle izmene koda

# Backend – sparky-dev radi nad kodom sa hosta (vendor u volumenu), test baza sparkylink_test
docker compose run --rm -T sparky-dev php artisan test
docker compose run --rm -T sparky-dev php artisan test tests/Feature/SpreadsheetVersionTest.php
docker compose run --rm -T sparky-dev php artisan test --filter="deo naziva testa"
docker compose run --rm -T sparky-dev composer install

# Frontend – sparky-node, node_modules u volumenima; pnpm build proverava i budžet početnog JS-a
docker compose run --rm --no-deps -T sparky-node sh -c "cd apps/web && npx tsc --noEmit && npx oxlint --type-aware && npx vitest run && pnpm build"
docker compose run --rm --no-deps -T sparky-node sh -c "cd apps/web && npx vitest run src/features/sites/lib/spreadsheet-import.test.ts"
docker compose run --rm --no-deps -T sparky-node pnpm install
docker compose --profile tools up sparky-node     # Vite dev server: http://localhost:3000 (API ide kroz sparky-web)

# Aplikacija koja radi
docker compose logs -f sparky-api sparky-queue sparky-schedule
docker compose exec sparky-api php artisan exchange-rates:fetch --date=2026-10-27
docker compose exec sparky-api php artisan receipts:retry
docker compose exec sparky-api php artisan admin:reset-super-admin-password   # nova lozinka vlasnika
docker compose exec sparky-api php artisan db:seed --force                    # probni podaci, samo lokalno
docker exec sparkylink_backup sparkylink-backup now                           # rezervna kopija odmah
```

**Pre završetka posla** obe provere moraju da prođu: ceo backend (`php artisan test`) i ceo frontend
red iznad (`tsc`, `oxlint`, `vitest`, `pnpm build`). Pet upozorenja `oxlint`-a u `image.ts` su stara.

## Arhitektura

Traefik → `sparky-web` (nginx: React build, prosleđuje `/api` i `/up`) → `sparky-api` (Laravel).
`sparky-queue` i `sparky-schedule` su isti image (red čekanja, zakazani zadaci iz
`backend/routes/console.php`), `sparky-gotenberg` pravi PDF, `sparky-backup` pravi noćne kopije.
Baza i API su samo na internoj mreži. `docker-compose.override.yml` se učitava samo lokalno
(sopstveni Traefik, portovi, alati `sparky-dev` i `sparky-node`).

### Backend (`backend/app`)

- **Rute**: `routes/admin.php` (prefiks `/api/admin`, Sanctum), bez podela po ulogama: sistem ima
  jedan nalog (vlasnik). `routes/api.php` služi samo fajlove preko relativnih potpisanih linkova
  (`FileController`).
- **Tok zahteva**: tanak kontroler (`Http/Controllers/<Domen>/Admin`) → zahtev
  (`Http/Requests`, `LocalizedFormRequest` + `Ruly`; `NormalizesDecimals` prihvata zarez) → akcija
  (`Actions/<Domen>/{Admin,Shared}`, `::make()->handle()`) → resurs (`Http/Resources`) →
  `response()->success()`.
- **Novac**: `Classes/Utilities/Money` (brick/math). Finansije gradilišta: `Site::withFinancials()`
  (zbirovi u SQL-u) + `Classes/Utilities/SiteFinancials` (naplata, troškovi, zarada, dug, status
  naplate); koriste ih lista gradilišta, `BuildSiteSummaryAction` i `BuildDashboardAction`.
- **Kurs**: `Actions/ExchangeRate/Shared/ResolveExchangeRateAction` (pri svakom čuvanju stavke, rada,
  uplate i dokumenta) i `FetchExchangeRateAction` (servis `kurs.resenje.org`).
- **Fiskalni računi**: `Contracts/FiscalReceiptFetcher` → `Services/FiscalReceipts/PursFiscalReceiptFetcher`
  (vezano u `AppServiceProvider`, u testovima se zamenjuje); akcije u `Actions/Receipt/Admin`.
- **Excel**: `ReadSpreadsheetItemsAction` (PhpSpreadsheet) → `MatchSpreadsheetFilesAction` +
  `Classes/Utilities/ImportedItemsMatcher` → `ImportSiteItemsAction`; zbirna nabavna `SetPurchasePricesAction`.
- **Dokumenti**: `CreateDocumentAction` (snimak u JSON-u, broj po vrsti i godini) →
  `RenderDocumentPdfAction` → `Classes/Utilities/PdfRenderer` (Gotenberg); šabloni u `resources/views/pdf/`.
- **Raspored osigurača**: `FuseBoardController` + `SaveFuseBoardAction` (cela tabla odjednom, redni broj =
  mesto u spisku). PDF se ne čuva: `FileController::fuseBoard` → `RenderFuseBoardPdfAction` →
  `PdfRenderer` sa `landscape: true`; četiri izgleda u `resources/views/pdf/fuse-board/` (enum
  `FuseBoardTemplate`, isti `layout.blade.php`).
- **Jedini nalog i podrazumevana podešavanja** upisuju migracije (na serveru nema seed-a);
  `2026_10_28_000002_keep_only_owner_account` je obrisala ranije naloge i uloge administrator i
  radnik. Od uloga je ostao samo `Role::SUPER_ADMIN` (prijava iz šablona). `DemoDataSeeder` je samo
  za lokalno.
- **Prevodi**: `lang/sr.json`, `lang/en.json` (+ `lang/{sr,en}/*.php`); jezik iz `X-Client-Locale`.
- **Testovi**: Pest, `tests/Feature` po domenu, MySQL baza `sparkylink_test` uz `RefreshDatabase`
  (pravi je `docker/mysql/init.sh`, samo pri prvom startu volumena). `tests/Unit/TestDatabaseGuardTest.php`
  čuva da testovi ne diraju pravu bazu; zajedničke pomoćne funkcije su u `tests/Pest.php`
  (`superAdmin()` je jedini nalog).

### Frontend (`frontend/apps/web/src`)

- **Rute** (`routes/`, TanStack, fajl = adresa, tanke): `_authed/gradilista/…`, `racuni`, `cenovnik`,
  `dashboard`, `podesavanja`; `_unauthed/sign-in`. Meni je u `lib/navigation.ts`. Zaštita ruta po
  ulogama iz šablona (`staticData.roles`, `lib/route-guard.ts`) postoji, ali je aplikacija ne koristi.
- **Funkcije**: `features/<domen>/{api,components,lib,pages,types,validation,config}`. Najveći je
  `features/sites`: `pages/site-detail.page.tsx` sa karticama `components/*-tab.tsx`; spisak kartica
  je u malom `config/site-tabs.ts`, da ruta ne bi uvukla celu stranicu u početni paket.
- **Logika bez React-a** je u `lib/` i `features/*/lib`, sa testom pored fajla: `money.ts` (decimale,
  zarez), `item-filters.ts`, `item-totals.ts`, `spreadsheet-import.ts`, `purchase-estimate.ts`,
  `fuse-board.ts`, `qr.ts`, `image.ts`.
- **Slike izgleda PDF-a rasporeda** (prelaz mišem preko dugmeta) su u
  `features/sites/assets/fuse-templates/*.webp`: posle izmene Blade šablona napraviti nove (šablon sa
  probnim podacima → Gotenberg `forms/chromium/screenshot/html`, 1036×698, webp).
- **API**: `lib/api.ts` (axios, isti domen `/api`); ključevi upita u `features/*/api/*.keys.ts`.
- **Prevodi**: `locales/sr.json` i `locales/en.json`, svaki ključ u oba (proverava `locales.test.ts`).
- **Budžet početnog JS-a**: 1250 kB (`scripts/check-bundle-budget.ts`, deo `pnpm build`); sada oko 830 kB.
  Sve što ne treba na prvom ekranu učitava se tek kad zatreba.

## Pravila domena (ne kršiti)

- Novac je `DECIMAL` i računa se kroz `Money`, nikad `float`. Svaki zapis čuva valutu unosa, kurs
  dana i oba iznosa; izveštaji sabiraju sačuvane kolone.
- Sistem ima jedan nalog (vlasnik): nema uloga, radnika ni upravljanja korisnicima. Ne vraćati ih
  bez izričitog zahteva vlasnika.
- Dokumenti za investitora (ponuda, završni račun) su snimci; kasnije izmene stavki ih ne menjaju.
  PDF nikad ne sadrži nabavne cene, rad radnika ni zaradu; u dnu stoji „Kreirano pomoću SparkyLink sistema“.
- Procena nabavne (`is_purchase_estimated`) prati cenu za investitora dok se ne upiše prava nabavna.
- Van obima: PDV, SEF, fiskalizacija i zakonsko poslovanje firme.

## Izgled

- Boje firme: žuta `#FDBA12` je glavna boja (dugmad, oznake, aktivne stavke), tamnoplava `#131430`
  je boja teksta. Tema aplikacije je u `frontend/apps/web/src/styles.css` (prepisuje temu iz
  `@app/ui`, koja se ne dira), PDF u `backend/resources/views/pdf/styles.blade.php`.
- Puna žuta se ne koristi za tekst ni tanke linije na beloj podlozi (kontrast 1,7:1); za to služi
  `--brand-deep` / `text-brand-deep`.
- Ikonice i statički fajlovi bez hash-a u imenu: posle izmene podići ime keša u `public/sw.js`
  (`sparkylink-shell-vN`), da ih telefoni preuzmu.

## Zamke

- Aplikacija na http://localhost radi iz image-a: izmena koda se ne vidi dok se image ne izgradi
  ponovo. Testovi (`sparky-dev`, `sparky-node`) rade nad kodom sa hosta.
- Lokalna baza ima prave podatke vlasnika: ne pokretati `migrate:fresh` ni `db:wipe` nad njom
  (testovi koriste samo `sparkylink_test`).
- `SECRET_PASSWORD` je obavezan: bez njega migracija prvog naloga baca grešku. Test vrednosti su u
  `backend/phpunit.xml` i `backend/.env.testing`.
- `.gitattributes` drži LF svuda; skripte koje idu u Docker ne rade sa CRLF.
- Kamera uživo za QR radi samo preko HTTPS-a (lokalno `https://<IP računara>` uz samopotpisan
  sertifikat); inače se račun slika.
