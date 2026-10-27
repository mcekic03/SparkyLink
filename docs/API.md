# SparkyLink – API

Laravel API po šablonu Larastarter. Sve prijavljene rute su pod `/api/admin` (Sanctum token:
`Authorization: Bearer <token>`), uz `Accept: application/json` i po želji `X-Client-Locale: sr|en`.
Odgovor: `{ "message"?, "data"?, "pagination"? }`; greška 422: `{ "message", "errors": { polje: [poruka] } }`.
Zabranjena ruta vraća **404** (kao šablon), da se frontend ne odjavi.

Iznosi su stringovi sa 2 decimale (`"117.35"`), kurs sa 4. Datumi bez vremena: `YYYY-MM-DD`.
Decimalni zarez se prihvata (`"12,5"`).

## Enumi

| Enum | Vrednosti |
|---|---|
| `role_id` | 1 super administrator, 2 administrator, 3 radnik |
| `currency` | 1 RSD, 2 EUR |
| `status` (gradilište) | 1 ponuda – čeka odgovor, 2 otvoreno, 3 zatvoreno |
| `payment_status` (računa se) | 1 nije plaćeno, 2 delimično plaćeno, 3 plaćeno u celosti |
| `type` (stavka) | 1 materijal, 2 usluga, 3 ostalo |
| `type` (dokument) | 1 ponuda, 2 završni račun |
| `status` (fiskalni račun) | 1 čeka preuzimanje, 2 preuzet, 3 greška, 4 slika računa |

## Prijava

| Ruta | Opis |
|---|---|
| `POST /api/admin/login` | `{ email, password }` → `{ token, expires_in, data: User }` |
| `POST /api/admin/refresh`, `POST /api/admin/logout` | novi token / odjava |
| `GET/PUT /api/admin/user/profile-information` | profil (ime, mejl, lozinka) |

## Svi prijavljeni (i radnik)

| Ruta | Opis |
|---|---|
| `GET /sites` | lista; `search`, `status`, `page`, `per_page`. Admin dobija i `financials` i filter `payment_status`, `trashed=1` |
| `GET /sites/{id}` | gradilište (radnik bez iznosa i marže) |
| `GET/POST /sites/{id}/notes`, `PUT/DELETE /notes/{id}` | napomene (menja autor ili admin) |
| `GET/POST /sites/{id}/media`, `PUT/DELETE /media/{id}` | slike i video: `file` (+ `thumbnail` za video, `caption`, `taken_at`); jedan fajl po zahtevu |
| `POST /sites/{id}/receipts/preview` | `{ qr_url }` → `{ fetched, receipt: { store_name, issued_at, total_amount, items: [...] } }` (ništa se ne čuva) |
| `POST /sites/{id}/receipts` | multipart: `qr_url` i/ili `photo`, `items[]` (stavke za uvoz), `note`, `store_name`, `issued_at` |
| `GET /sites/{id}/receipts`, `GET /receipts?search=`, `GET /receipts/{id}` | računi; detalj sadrži `journal` i `items_data` |
| `GET /settings` | podešavanja (radnik dobija samo naziv firme i logo) |

## Samo administratori (super-admin i admin)

| Ruta | Opis |
|---|---|
| `GET /dashboard?from=&to=` | zbirovi perioda, potraživanja, dužnici, zarada po mesecima, najbolja gradilišta |
| `POST /sites`, `PUT/DELETE /sites/{id}`, `POST /sites/{id}/restore` | gradilište (brisanje je meko) |
| `GET /sites/{id}/summary` | finansije gradilišta po vrstama + dug u valuti obračuna |
| `GET/POST /sites/{id}/items`, `PUT/DELETE /items/{id}` | stavke: `type, currency, name, unit, quantity, purchase_price, sale_price, occurred_at, exchange_rate?, note?, is_billable?, is_purchase_estimated?` (procena: nabavna = cena za investitora dok se ne upiše prava) |
| `POST /sites/{id}/items/spreadsheets` | multipart `files[]` (do 10 fajlova `.xls`/`.xlsx`): čita samo prvi list → `{ files: [{ name, items: [{ name, unit, quantity, unit_price, total }], error, candidates: [{ import_id, file_name, same, changed, new, missing, rows: [{ status, item_id, previous }] }], suggested_import_id }] }`; `candidates` su raniji uvozi sa istim nazivima stavki, `suggested_import_id` kad se poklapa bar pola stavki (ništa se ne čuva) |
| `POST /sites/{id}/items/import` | `{ occurred_at, files: [{ name, merge_into?, items: [{ name, unit?, quantity, sale_price }] }] }` → fajlovi bez `merge_into` su zajedno jedan nov uvoz (`item_import`, ime = imena fajlova); fajl sa `merge_into` je nova verzija tog uvoza: iste stavke se preskaču, izmenjenim se menja količina/jedinica/cena, nove se dodaju. Materijal u dinarima, cena za investitora iz fajla, nabavna je procena jednaka toj ceni (`is_purchase_estimated`); `data: { added, updated, unchanged }` |
| `POST /sites/{id}/items/purchase-prices` | `{ item_ids, percent }` ili `{ item_ids, total, currency }` → nabavna srazmerno ceni za investitora (koja se ne menja); zbir je tačno `total` u izabranoj valuti; usluge se preskaču |
| `GET/POST /sites/{id}/labor-entries`, `PUT/DELETE /labor-entries/{id}` | rad: `currency, workers_count, hours, hourly_rate, worked_at, exchange_rate?, description?` |
| `GET/POST /sites/{id}/payments`, `PUT/DELETE /payments/{id}` | uplate: `currency, amount, paid_at, exchange_rate?, note?` |
| `GET/POST /sites/{id}/documents`, `DELETE /documents/{id}` | ponuda / završni račun: `type, issued_at?, note?, is_itemized?` → `pdf_url` |
| `POST /receipts/{id}/refetch`, `POST /receipts/{id}/items`, `DELETE /receipts/{id}` | ponovno preuzimanje, naknadni uvoz stavki, brisanje (sa uvezenim stavkama) |
| `GET /item-suggestions?search=&type=` | predlozi iz cenovnika i ranijih stavki |
| `GET/POST /price-list-items`, `PUT/DELETE /price-list-items/{id}` | cenovnik |
| `GET /exchange-rates`, `GET /exchange-rates/{YYYY-MM-DD}`, `POST /exchange-rates` | kurs (preuzet ili ručni) |

## Samo super-admin

| Ruta | Opis |
|---|---|
| `GET/POST /users`, `GET/PUT/DELETE /users/{id}` | korisnici (`role_id` 1–3) |
| `PUT /settings`, `POST /settings/logo` | podaci firme, podrazumevane vrednosti, napomene na PDF-u, logo |

## Fajlovi (bez tokena)

Resursi daju **relativne potpisane** linkove (važe 2 sata): `url`/`thumbnail_url` slike i videa,
`photo_url` i `copy_url` računa, `pdf_url` dokumenta – rute `/api/files/...` sa `signature` u upitu.
Logo je javan: `GET /api/files/logo`.
