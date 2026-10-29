# SparkyLink – kako sistem radi

Opis aplikacije kakva je sada (28.10.2026). Prvobitna specifikacija i odluke su u
[`superpowers/specs/2026-10-26-sparkylink-design.md`](superpowers/specs/2026-10-26-sparkylink-design.md);
gde se razlikuju, važi ovaj dokument. Sve rute: [`API.md`](API.md).

## 1. Namena

Električar (vlasnik firme Cekić Elektrik) vodi više gradilišta istovremeno. Za svako treba da zna
koliko je platio (materijal, ostali troškovi, radnici), koliko naplaćuje investitoru (materijal po
ceni za investitora, usluge) i kolika mu je zarada, u evrima i u dinarima. Investitoru daje PDF
ponudu pre radova, završni račun na kraju i raspored osigurača za svaku tablu. Unos mora biti brz
sa telefona, na gradilištu.

Softver je interni: **van obima su PDV, SEF, e-fakture, fiskalizacija** i sve što je vezano za
zakonsko poslovanje firme. PDF je obračun, ne poreska faktura.

## 2. Nalog

- Sistem ima **jedan nalog: vlasnika**. Nema uloga, nema dodavanja korisnika, a prijavljen korisnik
  vidi i menja sve.
- Nalog pravi migracija pri prvom startu, iz `ADMIN_EMAIL` i `SECRET_PASSWORD`. Mejl i lozinka se
  menjaju u profilu; zaboravljena lozinka se vraća komandom (vidi `DEPLOYMENT.md`).
- Do 28.10.2026 su postojale uloge administrator i radnik. Migracija
  `2026_10_28_000002_keep_only_owner_account` briše sve ostale naloge, a ono što su uneli prepisuje
  na vlasnika.

## 3. Gradilište

- Podaci: naziv, adresa i mesto, investitor (ime, telefon, mejl, adresa), opis, datum početka i završetka.
- **Status**: ponuda – čeka odgovor (1), otvoreno (2), zatvoreno (3). Gradilište u statusu ponude
  se na Pregledu finansija ne računa ni u naplatu ni u dug.
- **Valuta obračuna** (EUR ili RSD): u njoj se računa dug i prave dokumenti.
- **Marža** (prazno = podrazumevana iz podešavanja, 20 %): predlaže cenu za investitora iz nabavne.
- **Status naplate** se računa sam iz naplate i uplata: nije plaćeno / delimično / plaćeno u celosti.
- Lista: pretraga, filter po statusu i po naplati, obrisana gradilišta. Brisanje je meko i može se
  poništiti; istorija se ne gubi.

## 4. Stavke

| Vrsta | Cene | Ide investitoru |
|---|---|---|
| Materijal | nabavna (koliko je firma platila) i cena za investitora | da |
| Usluga | samo cena za investitora (količina × cena) | da |
| Ostalo | trošak: gorivo, mašine, podizvođači… | podrazumevano ne, može da se uključi |

- Svaka stavka ima dan, valutu unosa (RSD ili EUR), kurs tog dana i oba iznosa (vidi tačku 12).
  `is_billable` određuje da li ide u dug i u dokumente.
- Pri ručnom unosu nude se predlozi iz cenovnika i ranijih stavki; cena za investitora se predlaže
  iz nabavne + marže.
- **Izvor** stavke: ručni unos, fiskalni račun (`receipt_id`) ili Excel uvoz (`item_import_id`).
- **Procena nabavne** (`is_purchase_estimated`): kad prava nabavna nije poznata (Excel uvoz), nabavna
  je jednaka ceni za investitora. Materijal tada ne pravi zaradu, a stavka nosi oznaku „nabavna nije
  upisana“. Kad se upiše prava nabavna (ručno ili zbirno, tačka 7), oznaka nestaje.
- Kartica „Stavke“: podkartice po vrsti, zbirovi (potrošeno, investitor duguje), pretraga po nazivu,
  filter po izvoru (osim kod usluga) i izbor više stavki kvačicama.

## 5. Fiskalni računi (QR kod)

1. QR kod sa računa (kamera, slika računa ili nalepljen link) vodi na `suf.purs.gov.rs` (Poreska
   uprava). Server preuzima račun: prodavnica, PIB, adresa, broj, datum, ukupno, tekst računa i
   stavke. Nazivi sa ćiriličnih računa se mogu preslovljavati u latinicu.
2. Pregled: stavke sa predloženom cenom za investitora (cena sa računa + marža) i izbor stavki.
3. Čuvanje: račun ostaje uz gradilište, a izabrane stavke postaju materijal u dinarima, po kursu
   na dan računa.

- Isti račun ne može dvaput: upozorenje kaže na kom je gradilištu već uvezen.
- Kad sajt Poreske uprave ne odgovara, račun se čuva sa linkom (status „čeka preuzimanje“). Zakazani
  zadatak `receipts:retry` pokušava svakog sata, najviše 10 puta, pa je status „greška“. Može i
  ručno („preuzmi ponovo“), a stavke se uvoze naknadno.
- Bez QR koda čuva se samo slika računa (status „slika računa“).
- **Garancija**: kopija računa kao PDF (tačan tekst, QR kod za proveru, slika ako postoji). Strana
  „Računi i garancije“ pretražuje sve račune po prodavnici i tekstu računa.
- Brisanje računa briše i stavke uvezene sa njega.

## 6. Uvoz iz Excel-a

Prodavnica šalje predračun kao `.xls`/`.xlsx`, uvek istog izgleda, ponekad više fajlova odjednom.

- Čita se samo prvi list. Kolone se prepoznaju po nazivima u zaglavlju (naziv, jedinica, količina,
  cena, ukupno), a red „UKUPNO:“ se preskače.
- Pregled pre uvoza: svi redovi su izabrani, cena se može ispraviti, red isključiti; vidi se zbir
  izabranih. Do 10 fajlova odjednom, uz „Dodaj još fajlova“; bira se dan uvoza.
- Sve ubačeno odjednom, i više fajlova, je **jedan uvoz** (`item_imports`, ime = imena fajlova).
  Stavke nose oznaku „iz Excel-a“.
- Uvezena stavka je materijal u dinarima: cena iz fajla je cena za investitora, a nabavna je procena
  (tačka 4).

**Nova verzija istog dokumenta.** Kad prodavnica pošalje izmenjen predračun, server poredi stavke
fajla sa ranijim uvozima tog gradilišta po nazivu (bez obzira na velika slova, razmake i ćirilicu;
isti naziv više puta uparuje se redom). Kad se poklopi bar pola stavki, predlaže raniji uvoz čija je
ovo nova verzija, a korisnik bira „Novi dokument – sve se dodaje“ ili „Nova verzija: …“. Kao nova verzija:

- iste stavke se preskaču;
- izmenjenim se menjaju količina, jedinica i cena (dan i kurs ostaju; upisana nabavna ostaje, a
  procena prati novu cenu);
- nove stavke se dodaju u isti uvoz;
- stavke kojih nema u novom fajlu se **ne brišu**.

Posle uvoza poruka kaže koliko je stavki dodato, izmenjeno i ostalo bez promene.

## 7. Nabavna cena naknadno (zbirno)

Nabavna se ne upisuje stavku po stavku. Bira se ceo uvoz, „Sve bez nabavne cene“ ili bilo koje
stavke kvačicama, pa jedno od:

- **popust u procentima** od cene za investitora;
- **ukupno plaćeno** u RSD ili EUR – raspoređuje se srazmerno ceni za investitora, tako da je zbir
  tačno uneti iznos (na paru, i u evrima).

Cena za investitora se ne menja, usluge se preskaču, a oznaka procene nestaje.

## 8. Radnici, uplate, dug i zarada

- **Rad radnika** je trošak firme: dan, broj radnika, sati, cena sata, opis → radnici × sati × cena.
  Investitor ga ne vidi i ne ulazi u dokumente.
- **Uplate investitora**: dan, iznos, valuta, napomena.
- **Naplata** = naplative stavke po ceni za investitora.
- **Troškovi** = nabavni iznos svih stavki + rad radnika.
- **Zarada** = naplata − troškovi.
- **Dug** = naplata − uplate, u valuti obračuna gradilišta; druga valuta se prikazuje po današnjem
  kursu. Negativan dug je preplata.

## 9. Ponuda i završni račun (PDF)

- Pravi se iz trenutnog stanja naplativih stavki i **čuva kao snimak** (JSON + PDF): kasnije izmene
  stavki ne menjaju izdat dokument.
- Broj je `redni/godina` (npr. `3/2026`), poseban niz za ponude i za završne račune.
- Iznosi su u valuti obračuna gradilišta, a druga valuta po kursu na dan dokumenta (kurs se ispisuje).
- Grupe: „Radovi i usluge“, „Materijal“ (po stavkama ili jedan zbirni red), „Ostalo“ (samo naplativo).
- **Ponuda** nosi napomenu da su cene i količine materijala okvirne (tekst iz podešavanja).
- **Završni račun** dodaje uplate, preostali dug u obe valute i napomenu sa dna (iz podešavanja).
- PDF ima logo i podatke firme, investitora i gradilište, a u dnu „Kreirano pomoću SparkyLink
  sistema“. **Nikad** ne sadrži nabavne cene, rad radnika ni zaradu.

## 10. Raspored osigurača

- Svaka tabla (ormar) na gradilištu ima svoj raspored, pod svojim nazivom (npr. „Razvodni ormar –
  prizemlje“); tabli može biti više.
- Osigurač: redni broj, šta napaja, jačina (6, 10, 16, 20, 25 ili 32 A) i tip (B ili C). Redni broj
  je mesto u spisku, pa se posle premeštanja i brisanja brojevi sami poređaju. Novi osigurač dobija
  tip i jačinu prethodnog (prvi B16).
- Spisak se menja na miru (dodavanje, gore/dole, uklanjanje) i čuva odjednom. Nesačuvane izmene ostaju
  pri prelasku na drugu tablu, a pri izlasku sa stranice aplikacija upozorava.
- **PDF se ne čuva**: pravi se pri svakom otvaranju, od sačuvanog rasporeda, A4 položeno, u jednom od
  četiri izgleda: tabela, šema table (moduli na DIN šini), kartice, tehnički crtež. Prelaz mišem
  preko dugmeta pokazuje sliku izgleda. Dok ima nesačuvanih izmena, dugmad za PDF su isključena.
- Na PDF-u su logo i naziv firme (telefon i mejl iz podešavanja), naziv table, investitor, gradilište
  i adresa, datum pravljenja, objašnjenje B/C i u dnu „Kreirano pomoću SparkyLink sistema“. Osigurači
  koji ne staju prelaze na sledeću stranu (tabela i šema 24 po strani, kartice i crtež 18).

## 11. Slike, video i napomene

- Više fajlova odjednom sa telefona. Slike se u pregledaču smanjuju na najviše 2560 px (JPEG), a
  server pravi sličicu od 480 px. Video do 512 MB ide bez prerade, a sličicu (prvi kadar) pravi pregledač.
- Svi fajlovi su privatni i prikazuju se preko potpisanih linkova koji važe 2 sata. Logo firme je javan.
- Napomene: kratak tekst sa vremenom unosa; mogu da se izmene i obrišu.

## 12. Cenovnik, Pregled finansija, podešavanja

- **Cenovnik**: materijal i usluge sa jedinicom, nabavnom i prodajnom cenom i valutom. Služi za
  predloge pri unosu stavke.
- **Pregled finansija** za izabran period (podrazumevano od 1. januara do danas): naplaćeno,
  troškovi, zarada i uplaćeno u obe valute; ukupno potraživanje i spisak dužnika (bez obzira na
  period); zarada po mesecima (12 meseci); pet najisplativijih gradilišta. Ponude se ne računaju.
- **Podešavanja** (menja samo vlasnik): podaci firme za PDF (naziv, adresa, mesto, telefon, mejl,
  PIB, MB, tekući račun, veb-sajt), logo, podrazumevana valuta i marža, napomena ponude i napomena
  završnog računa. Tu se kurs može upisati i ručno.

## 13. Novac i kurs

- Iznosi su `DECIMAL(14,2)`, kurs `DECIMAL(12,4)`. Računa se preko `brick/math`
  (`App\Classes\Utilities\Money`), zaokruživanje na 2 decimale „pola naviše“; nikad `float`.
- Kurs je srednji kurs NBS za evro (dinara za 1 €) na dan stavke, sa `kurs.resenje.org`. Preuzima se
  svakog dana u 08:30 i 12:30 i čuva u `exchange_rates`. Za vikend i praznik važi poslednji objavljen
  kurs, a za budući dan današnji. Kad servis ne odgovara, uzima se poslednji poznat kurs do 10 dana
  unazad; ako ni njega nema, greška je na polju `exchange_rate` i kurs se upisuje ručno.
- Svaka stavka, rad i uplata čuva valutu unosa, kurs (izmenjiv) i **oba iznosa**, izračunata pri
  čuvanju. Izveštaji sabiraju sačuvane kolone, pa promena kursa kasnije ne menja stare obračune.
- Iznos = zaokruži(količina × cena); drugi iznos = zaokruži(iznos × kurs) ili zaokruži(iznos ÷ kurs).
- Unos prihvata decimalni zarez i tačku (`12,5` = `12.5`).
- Dani bez vremena (dan stavke, uplate…) čuvaju se kao `dateTime` u ponoć i šalju kao `YYYY-MM-DD`.

## 14. Zakazani zadaci i rezervne kopije

| Kada | Šta | Ko |
|---|---|---|
| 08:30 i 12:30 | preuzimanje kursa (`exchange-rates:fetch`) | `sparky-schedule` |
| svakog sata | ponovno preuzimanje računa koji čekaju (`receipts:retry`) | `sparky-schedule` |
| svakog dana | brisanje isteklih prijava (`sanctum:prune-expired`) | `sparky-schedule` |
| 02:30 | kopija baze, nedeljom i kopija fajlova | `sparky-backup` |

## 15. Model podataka (MySQL 8.4)

| Tabela | Šta čuva |
|---|---|
| `users`, `roles` | jedan nalog (vlasnik); jedna uloga (1), zbog prijave iz šablona |
| `settings` | ključ–vrednost: podaci firme, podrazumevane vrednosti, napomene, putanja loga |
| `exchange_rates` | kurs po valuti i danu; izvor 1 servis, 2 ručno |
| `sites` | gradilište: status, valuta obračuna, investitor, marža, datumi; meko brisanje |
| `site_items` | stavke: vrsta, valuta, količina, nabavna i prodajna cena, kurs, `purchase_total_rsd/eur`, `sale_total_rsd/eur`, `is_billable`, `is_purchase_estimated`, `receipt_id`, `item_import_id` |
| `item_imports` | jedan Excel uvoz (gradilište, imena fajlova) |
| `labor_entries` | rad radnika sa `total_rsd/eur` |
| `payments` | uplate sa `amount_rsd/eur` |
| `receipts` | fiskalni računi: status, `qr_url`, `qr_hash` (jedinstven), prodavnica, tekst računa, `items_data` (JSON), slika, pokušaji preuzimanja |
| `documents` | ponude i završni računi: broj, kurs, iznosi, `snapshot` (JSON), `pdf_path` |
| `fuse_boards`, `fuses` | table (ormari) gradilišta; osigurači: redni broj (`position`), šta napaja, tip 1 B / 2 C, jačina u amperima |
| `site_notes`, `site_media` | napomene; slike i video (putanja, sličica, dimenzije) |
| `price_list_items` | cenovnik |

Fajlovi su na privatnom disku `local` (`storage/app`, na serveru volumen `api_storage`):
`sites/{id}/media`, `receipts/{id}`, `documents/{id}`.

## 16. Telefon (PWA)

- Manifest i service worker su u `frontend/apps/web/public/`; aplikacija se dodaje na početni ekran.
  Keširaju se samo statički delovi, a podaci uvek idu preko mreže.
- Kamera uživo za QR kod radi samo preko HTTPS-a. Lokalno, preko IP adrese i HTTP-a, račun se
  slika („Slikaj račun“) i QR se čita sa slike.
