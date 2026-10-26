# SparkyLink — specifikacija

*Vlasnik softvera: Cekić Elektrik. Datum: 26.10.2026. Repozitorijum: `SparkyLink`.*

## 1. Namena

SparkyLink je interni softver za električara koji vodi više gradilišta. Za svako
gradilište beleži koliko je **on platio** (materijal, ostali troškovi, radnici), koliko
**naplaćuje investitoru** (materijal po prodajnoj ceni, usluge rada) i kolika mu je
**zarada**. Investitoru se daje PDF obračun sa logom firme na kome vidi samo ono što
duguje. Svi iznosi se vode **u evrima i u dinarima** — obe valute su ravnopravne.

Softver je **interni**: nema PDV-a, SEF-a, fiskalizacije niti bilo čega vezanog za
zakonsko poslovanje firme. PDF je obračun, ne poreska faktura.

## 2. Ciljevi, ne-ciljevi, anti-ciljevi

**Ciljevi**
- Brz unos sa telefona na gradilištu (PWA, ekrani prilagođeni telefonu).
- Skeniranje QR koda sa fiskalnog računa → stavke (naziv, količina, cena) same ulaze kao materijal.
- Fiskalni račun ostaje sačuvan uz gradilište i može da se odštampa za garanciju.
- Tačan obračun zarade po gradilištu i ukupno, u obe valute.
- PDF obračun za investitora sa logom i podacima firme.
- Istorija svih gradilišta (ništa se ne gubi; pretraga).
- Slike i video snimci uz gradilište (gde su prošli kablovi), napomene.
- Više korisničkih naloga, prijava.
- Ceo sistem u jednom Docker steku spremnom za produkciju (Traefik + nginx + zasebna baza).

**Ne-ciljevi (v1)**
- PDV, SEF, e-fakture, fiskalni uređaj, poreske evidencije.
- Ponude pre početka radova, rad bez interneta, deljenje linka investitoru — za kasnije.

**Anti-ciljevi (šta bi bio neuspeh i kad tehnički radi)**
- Stari obračuni se menjaju kad se promeni kurs evra.
- Investitor u PDF-u vidi nabavne cene ili zaradu.
- Radnik sa nalogom vidi zaradu ili nabavne cene preko API-ja.
- Unos na telefonu traje duže od zapisivanja u svesku.

## 3. Korisnici i uloge

| Uloga | `role_id` | Šta sme |
|---|---|---|
| Super administrator (vlasnik) | 1 | sve, uključujući korisnike i podešavanja |
| Administrator | 2 | sve osim korisnika i podešavanja firme |
| Radnik | 3 | gradilišta (osnovni podaci), napomene, slike/video, skeniranje računa; **bez** iznosa, zarade, uplata, obračuna, cenovnika, pregleda finansija |

Zabrana se sprovodi na backendu (ruta vraća 404 kao u šablonu; resursi ne šalju
novčana polja radniku), a frontend samo sakriva ono što radnik ne može.

## 4. Funkcije

### 4.1 Gradilišta
Naziv, adresa, mesto, investitor (ime, telefon, mejl, adresa), opis, status
(U toku / Završeno), valuta obračuna (EUR podrazumevano), marža za gradilište
(prazno = podrazumevana iz podešavanja), datum početka i završetka.
Lista sa pretragom, filterom po statusu i „ima dug", sortiranjem. Brisanje je
meko (soft delete) — istorija ostaje.

### 4.2 Stavke gradilišta
Tri vrste, ista forma (naziv, jedinica mere, količina, cena po jedinici, datum, napomena):
- **Materijal** — nabavna cena (koliko je platio) i prodajna cena (koliko naplaćuje).
  Prodajna se predlaže iz nabavne + marže.
- **Usluga** — samo prodajna cena (količina × cena po komadu).
- **Ostalo** — ručni trošak (gorivo, mašine, podizvođači…): naziv, količina, cena;
  podrazumevano se ne naplaćuje investitoru, ali može.

Svaka stavka ima `is_billable` (ide u obračun investitoru). Unos u RSD ili EUR.

### 4.3 Rad radnika (trošak)
Po danu: datum, broj radnika, sati, cena sata, opis → trošak = radnici × sati × cena.
Investitor to ne vidi.

### 4.4 Uplate investitora
Datum, iznos, valuta, napomena. Dug = naplata − uplate.

### 4.5 Obračun za investitora (PDF)
Pravi se iz trenutnog stanja i **čuva kao snimak** (broj `N/GGGG`, datum, kurs,
stavke, uplate, PDF). Kasnije izmene stavki ne menjaju izdat obračun. Opcije:
datum, napomena, materijal po stavkama ili zbirno. Sadržaj: logo i podaci firme,
investitor i gradilište, usluge, materijal, ostalo (samo naplativo), međuzbirovi,
ukupno u obe valute, uplate, preostali dug u obe valute, kurs, mesto za potpis.

### 4.6 Fiskalni računi
- QR kod sa računa vodi na `https://suf.purs.gov.rs/v/?vl=…` (Poreska uprava). Softver
  preuzima ceo račun: prodavnica, PIB, adresa, datum, broj, ukupno, tekst računa (žurnal)
  i stavke (naziv, količina, jedinica, jedinična cena, ukupno).
- Tok: skeniraj (kamera ili slika računa ili nalepljen link) → pregled stavki sa predloženom
  prodajnom cenom → izbor stavki → uvoz kao **materijal** (RSD, kurs na dan računa).
- Isti račun ne može dvaput (upozorenje sa gradilištem gde je već uvezen).
- Ako sajt Poreske uprave ne odgovara: račun se čuva sa linkom (status „čeka"),
  zakazani zadatak pokušava ponovo; stavke se uvoze kasnije.
- Bez QR koda: čuva se slika računa (status „ručno").
- **Garancija**: kopija računa (tačan tekst + QR kod za proveru + slika ako postoji) kao PDF;
  pretraga svih računa po prodavnici i tekstu računa.
- Nazivi stavki sa ćiriličnih računa se mogu preslovljavati u latinicu (podrazumevano da).

### 4.7 Slike i video
Više fajlova odjednom, sa telefona. Slike se smanjuju u pregledaču (najviše 2560 px)
pre slanja; server pravi sličicu. Video do 512 MB, bez prerade; sličicu pravi pregledač.
Fajlovi su privatni — prikazuju se preko potpisanih privremenih linkova.

### 4.8 Napomene
Kratke napomene po gradilištu, sa autorom i vremenom.

### 4.9 Cenovnik
Usluge i materijal sa jedinicom i cenama (nabavna, prodajna) i valutom. Pri unosu
stavke: pretraga po cenovniku i po ranije unetim stavkama (poslednje cene).

### 4.10 Pregled (analitika)
Za izabran period: naplaćeno, troškovi, zarada, uplaćeno (EUR i RSD); ukupno
potraživanje od investitora i spisak dužnika; aktivna gradilišta; zarada po mesecima
(12 meseci); najisplativija gradilišta.

### 4.11 Podešavanja
Podaci firme (naziv, adresa, mesto, telefon, mejl, PIB, MB, tekući račun, veb-sajt),
logo, podrazumevana valuta obračuna, podrazumevana marža, napomena na dnu obračuna.

### 4.12 PWA
Manifest, ikone iz loga, service worker; instalacija na telefon. Kamera uživo traži
HTTPS (produkcija); preko lokalne mreže (HTTP) radi skeniranje iz slike računa.

## 5. Pravila za novac i dve valute

- Novac: `DECIMAL(14,2)`, kurs `DECIMAL(12,4)`; računanje preko `brick/math`, zaokruživanje
  na 2 decimale „pola naviše". Nikad `float`.
- Kurs = srednji kurs NBS za EUR (dinara za 1 €) na dan stavke. Izvor:
  `https://kurs.resenje.org/api/v1/currencies/eur/rates/{YYYY-MM-DD}` (polje `exchange_middle`).
  Čuva se u tabeli `exchange_rates`; zakazani zadatak ga preuzima svakog jutra (08:30 i 12:30).
  Za vikend/praznik važi poslednji objavljen kurs; za budući datum važi današnji.
  Ako kurs nije dostupan i nema ranijeg — greška 422 na polju `exchange_rate`, korisnik ga upisuje ručno.
- Svaki novčani zapis (stavka, rad, uplata) čuva: valutu unosa, kurs tog dana (izmenjiv) i
  **oba iznosa** izračunata pri čuvanju. Izveštaji sabiraju kolone po valuti. Promena kursa
  kasnije ne menja ništa.
- Iznos stavke = zaokruži(količina × cena); drugi iznos = zaokruži(iznos × kurs) ili
  zaokruži(iznos ÷ kurs).
- Gradilište ima **valutu obračuna**. Dug se računa u njoj (naplaćeno − uplaćeno), a druga valuta
  se prikazuje po današnjem kursu.
- Obračun (PDF): kolona u valuti obračuna = sačuvani iznosi stavki; druga valuta = preračun po
  kursu na dan obračuna (kurs se ispisuje).
- Zarada = naplaćeno (naplative stavke, prodajni iznos) − troškovi (nabavni iznos svih stavki + rad).
- Unos decimala prihvata i zarez i tačku (`12,5` = `12.5`).

## 6. Model podataka (MySQL 8.4)

Pravila iz `backend/CLAUDE.md`: redosled kolona, `dateTime()` + sufiks `_at`, enumi kao
`tinyInteger` od 1. Datumi bez vremena (dan stavke, uplate…) čuvaju se kao `dateTime` u ponoć i
šalju kao `YYYY-MM-DD`, bez pomeranja zone.

| Tabela | Ključne kolone |
|---|---|
| `users`, `roles` | iz šablona; uloge 1, 2, 3 |
| `settings` | ključ–vrednost (podaci firme, podrazumevane vrednosti, putanja loga) |
| `exchange_rates` | `currency`, `source` (1 API, 2 ručno), `rate`, `effective_at` (jedinstveno po valuti i danu) |
| `sites` | `created_by`, `status`, `currency`, `name`, `address`, `city`, `investor_*`, `description`, `markup_percent`, `started_at`, `completed_at`, soft delete |
| `site_items` | `site_id`, `receipt_id`, `created_by`, `type`, `currency`, `name`, `unit`, `quantity`, `purchase_price`, `sale_price`, `exchange_rate`, `purchase_total_rsd/eur`, `sale_total_rsd/eur`, `note`, `is_billable`, `occurred_at` |
| `labor_entries` | `site_id`, `created_by`, `currency`, `workers_count`, `hours`, `hourly_rate`, `exchange_rate`, `total_rsd/eur`, `description`, `worked_at` |
| `payments` | `site_id`, `created_by`, `currency`, `amount`, `exchange_rate`, `amount_rsd/eur`, `note`, `paid_at` |
| `site_notes` | `site_id`, `user_id`, `body` |
| `site_media` | `site_id`, `user_id`, `type`, `disk`, `path`, `thumbnail_path`, `original_name`, `mime_type`, `size`, `width`, `height`, `caption`, `taken_at` |
| `receipts` | `site_id`, `created_by`, `status`, `qr_url`, `qr_hash` (jedinstven), `store_*`, `receipt_number`, `receipt_counter`, `total_amount`, `journal`, `items_data` (json), `photo_path`, `fetch_error`, `fetch_attempts`, `note`, `issued_at`, `fetched_at` |
| `statements` | `site_id`, `created_by`, `currency`, `number`, `year`, `sequence`, `exchange_rate`, `total_amount`, `paid_amount`, `balance_amount`, `snapshot` (json), `pdf_path`, `note`, `is_itemized`, `issued_at` |
| `price_list_items` | `type`, `currency`, `name`, `unit`, `purchase_price`, `sale_price`, `is_active` |

## 7. API

Laravel API po šablonu Larastarter (`backend/CLAUDE.md`): `LocalizedFormRequest` + `Ruly`,
akcije sa `AsAction`, `response()->success()`, resursi, `Filterable`, Sanctum token.
Sve prijavljene rute su pod `/api/admin`. Fajlovi (slike, PDF) idu preko relativnih
potpisanih linkova pod `/api/files/*` (važe 2 sata). Ceo ugovor: `docs/API.md`.

## 8. Frontend

React šablon iz Stare Vodenice (`frontend/CLAUDE.md`): pnpm monorepo, Vite 8, React 19,
TypeScript 7, TanStack Router/Query/Form/Table, Zod, shadcn/ui + Tailwind 4, i18next (sr/en),
Vitest + MSW. API je na istom domenu (`/api`), pa adresa API-ja = adresa stranice.

## 9. Docker stek

Jedan stek (`docker-compose.yml` u korenu), po uzoru na Staru Vodenicu:

| Servis | Šta je |
|---|---|
| `sparky-web` | nginx: servira React build i prosleđuje `/api` i `/up` backendu; jedini na mreži `proxy` (Traefik labele) |
| `sparky-api` | Laravel (serversideup/php 8.4 fpm-nginx), migracije pri startu (AUTORUN) |
| `sparky-queue`, `sparky-schedule` | isti image; red čekanja i zakazani zadaci |
| `sparky-mysql` | MySQL 8.4, samo interna mreža |
| `sparky-gotenberg` | pravljenje PDF-a (Chromium) |
| `sparky-backup` | svake noći `mysqldump` baze i arhiva fajlova u volumen `backups` |

Produkcija: postojeći Traefik na serveru (mreža `proxy`, `websecure`, `letsencrypt`,
`redirect-to-https@file`), bez objavljenih portova. Lokalno: `docker-compose.override.yml`
dodaje sopstveni Traefik (portovi 80/443) i rute bez domena, pa aplikacija radi na
`http://localhost` i sa telefona na `http://<IP računara>`.

## 10. Odluke koje sam doneo sam (proveriti)

1. Laravel 12 (kao šablon Stare Vodenice), PHP 8.4 — ne 13, zbog kompatibilnosti šablona.
2. API + React SPA umesto Inertia — smernice su API-orijentisane.
3. Uloga „Radnik" sa ograničenim pristupom (pitanje o nalozima je ostalo bez odgovora).
4. Valuta obračuna po gradilištu (podrazumevano EUR); dug u njoj.
5. Obračuni se čuvaju kao numerisani snimci `N/GGGG`.
6. Podrazumevana marža 20 %.
7. Izgled PDF-a je nov (stari primer računa nije dostavljen) — lako se menja.
8. Rezervna kopija je lokalna (volumen `backups`); slanje na drugo mesto traži odredište od vlasnika.

## 11. Za kasnije

Ponude pre radova, rad bez interneta, deljeni link za investitora, otpremanje videa u delovima,
sažimanje videa, slanje rezervne kopije u oblak, prelazak na Laravel 13.
