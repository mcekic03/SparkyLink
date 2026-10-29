# Postavljanje na server (Portainer + Traefik)

Jedan stack iz ovog repozitorijuma (`docker-compose.yml`). Uklapa se u postojeći Traefik isto kao
Stara Vodenica: `sparky-web` (nginx) sedi na zajedničkoj mreži `proxy`, Traefik ga vidi po labelama,
vadi Let's Encrypt sertifikat i preusmerava HTTP na HTTPS. Stack **ne objavljuje nijedan port**;
baza, API, Gotenberg i rezervne kopije su samo na internoj mreži.

Produkcija: **https://sparkylink.vtsappsteam.edu.rs**, stack `sparkylink` u Portaineru, grana `master`.

| Servis | Šta radi |
|---|---|
| `sparky-web` | nginx: React aplikacija + prosleđivanje `/api` i `/up` backendu |
| `sparky-api` | Laravel API; pri startu pokreće migracije (nalog vlasnika, podešavanja) |
| `sparky-queue`, `sparky-schedule` | red čekanja; zakazani zadaci (kurs NBS 08:30 i 12:30, ponovno preuzimanje računa) |
| `sparky-mysql` | MySQL 8.4 (volumen `mysql`) |
| `sparky-gotenberg` | pravi PDF (ponude, završni računi, kopije računa) |
| `sparky-backup` | svake noći kopija baze, nedeljom i arhiva fajlova (volumen `backups`) |

## 1. Pre početka

- server sa Dockerom i Portainerom, Traefik radi i postoji mreža `proxy` (`docker network ls | grep proxy`)
- Traefik ima entrypoint-e `web` i `websecure`, resolver `letsencrypt` i middleware `redirect-to-https@file`
  (drugačija imena se zadaju kroz `TRAEFIK_*` promenljive)
- DNS zapis domena pokazuje na server **pre** prvog pokretanja (inače nema sertifikata)

## 2. Tajne

```bash
# APP_KEY
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
# lozinke (DB_PASSWORD, DB_ROOT_PASSWORD, SECRET_PASSWORD)
for i in 1 2 3; do openssl rand -base64 24 | tr -d '+/='; done
```

Ni u jednoj vrednosti ne sme biti znak `$` (Compose ga tumači kao promenljivu). Vrednosti za
produkciju čuva vlasnik, van repozitorijuma; u repozitorijumu je samo spisak ([`.env.example`](.env.example)).

## 3. Stack u Portaineru

1. **Stacks → Add stack**, ime `sparkylink`, Build method **Repository**:
   - Repository URL `https://github.com/mcekic03/SparkyLink` (javan, bez prijave)
   - Repository reference `refs/heads/master`
   - Compose path `docker-compose.yml`; **Additional paths prazno** (`docker-compose.override.yml`
     je samo za lokalno: diže drugi Traefik i otvara portove)
2. **Environment variables** (Advanced mode) – obavezne: `APP_KEY`, `APP_DOMAIN`, `DB_PASSWORD`,
   `DB_ROOT_PASSWORD`, `SECRET_PASSWORD` (lozinka prvog naloga); po želji `ADMIN_EMAIL`
   (podrazumevano `ceka.mihajlo03@gmail.com`). Probni podaci se na serveru ne prave.
   Ceo spisak sa objašnjenjima: [`.env.example`](.env.example).
3. **Deploy the stack**. Prvo pravljenje traje nekoliko minuta (Composer, pnpm, Vite).

Provera: `https://<domen>/up` vraća 200, `https://<domen>` otvara prijavu.

## 4. Posle prvog starta

1. Prijava sa `ADMIN_EMAIL` / `SECRET_PASSWORD` → **promeni lozinku** (profil).
2. **Podešavanja**: podaci firme (telefon, adresa, PIB…), podrazumevana marža i valuta, napomene na PDF-u.
3. Na telefonu: otvori adresu u pregledaču → „Dodaj na početni ekran“ (PWA).

Sistem ima jedan nalog (vlasnik); drugih naloga i uloga nema.

## 5. Ažuriranje

1. Rad ide na grani `develop`. Kad je izmena spremna i provere prolaze, `master` se pomera na
   `develop` i šalje na GitHub (samo po nalogu vlasnika).
2. Portainer → stack `sparkylink` → **Pull and redeploy** (ili uključiti Automatic updates).

`sparky-api` pri startu pušta nove migracije. Podaci su u volumenima `mysql`, `api_storage`, `backups`;
brisanje stack-a ih ne briše.

## 6. Rezervne kopije

`sparky-backup` svake noći u `BACKUP_TIME` (podrazumevano 02:30) pravi
`/backups/db/sparkylink_<datum>.sql.gz`, a nedeljom i `/backups/files/…tar.gz` (slike, video, računi,
PDF-ovi). Čuva se `BACKUP_KEEP_DAYS` dana. **Kopiju van servera** treba dodatno podesiti (npr. rclone ka
oblaku ili drugi server) – volumen je na istom disku kao i aplikacija.

Ručno, odmah: `docker exec sparkylink_backup sparkylink-backup now`

Vraćanje baze:

```bash
gunzip -c sparkylink_<datum>.sql.gz | docker exec -i sparkylink_mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" sparkylink'
```

## 7. Prenos podataka sa računara

SQL fajl (npr. gradilište uneto lokalno) pušta se jednom, u bazu stack-a:

```bash
# preko SSH-a na serveru
docker exec -i sparkylink_mysql sh -c 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < podaci.sql
```

ili kroz Portainer: **Containers → `sparkylink_mysql` → Console** (`/bin/sh`), pokrene se ista
`mysql` komanda (bez `< podaci.sql`) i nalepi sadržaj fajla.

Fajlovi (npr. slika fiskalnog računa) idu u volumen `api_storage`, pod putanjom iz baze
(`receipts.photo_path`): `docker cp slika.jpg sparkylink_api:/var/www/html/storage/app/receipts/<id gradilišta>/`.

## 8. Ako nešto ne radi

| Simptom | Uzrok / rešenje |
|---|---|
| stack neće da se digne, javlja koja promenljiva fali | dodaj je (vidi tačku 3) |
| `sparky-api` unhealthy, „Access denied“ u logu | `DB_PASSWORD` ne odgovara postojećem volumenu baze |
| nema sertifikata | DNS ne pokazuje na server ili port 80/443 nije otvoren |
| posle „Pull and redeploy“ nema izmena | izmena nije na grani `master` na GitHub-u (tačka 5) |
| zaboravljena lozinka vlasnika | konzola `sparkylink_api`: `php artisan admin:reset-super-admin-password` (ispisuje novu) |
| veliki video puca posle ~60 s | Traefik `respondingTimeouts.readTimeout` na serveru je prekratak – povećati (npr. 15m) |
| fiskalni račun „čeka preuzimanje“ | sajt Poreske uprave nije odgovarao; `sparky-schedule` pokušava svakog sata |
| PDF se ne pravi | `docker logs sparkylink_gotenberg`; servis mora biti gore |
