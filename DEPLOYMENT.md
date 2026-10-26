# Postavljanje na server (Portainer + Traefik)

Jedan stack iz ovog repozitorijuma (`docker-compose.yml`). Uklapa se u postojeći Traefik isto kao
Stara Vodenica: `sparky-web` (nginx) sedi na zajedničkoj mreži `proxy`, Traefik ga vidi po labelama,
vadi Let's Encrypt sertifikat i preusmerava HTTP na HTTPS. Stack **ne objavljuje nijedan port**;
baza, API, Gotenberg i rezervne kopije su samo na internoj mreži.

| Servis | Šta radi |
|---|---|
| `sparky-web` | nginx: React aplikacija + prosleđivanje `/api` i `/up` backendu |
| `sparky-api` | Laravel API; pri startu pokreće migracije (prvi nalog, uloge, podešavanja) |
| `sparky-queue`, `sparky-schedule` | red čekanja; zakazani zadaci (kurs NBS 08:30 i 12:30, ponovno preuzimanje računa) |
| `sparky-mysql` | MySQL 8.4 (volumen `mysql`) |
| `sparky-gotenberg` | pravi PDF (ponude, završni računi, kopije računa) |
| `sparky-backup` | svake noći dump baze, nedeljom i arhiva fajlova (volumen `backups`) |

## 1. Pre početka

- server sa Dockerom i Portainerom, Traefik radi i postoji mreža `proxy` (`docker network ls | grep proxy`)
- Traefik ima entrypoint-e `web` i `websecure`, resolver `letsencrypt` i middleware `redirect-to-https@file`
  (drugačija imena se zadaju kroz `TRAEFIK_*` promenljive)
- DNS zapis domena (npr. `sparkylink.cekic-elektrik.rs`) pokazuje na server **pre** deploy-a

## 2. Tajne

```bash
# APP_KEY
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
# lozinke (DB_PASSWORD, DB_ROOT_PASSWORD, SECRET_PASSWORD)
for i in 1 2 3; do openssl rand -base64 24 | tr -d '+/='; done
```

Ni u jednoj vrednosti ne sme biti znak `$` (Compose ga tumači kao promenljivu).

## 3. Stack u Portaineru

1. **Stacks → Add stack**, ime `sparkylink`, Build method **Repository**, compose path `docker-compose.yml`
2. **Environment variables** (Advanced mode) – obavezne: `APP_KEY`, `APP_DOMAIN`, `DB_PASSWORD`,
   `DB_ROOT_PASSWORD`, `SECRET_PASSWORD` (lozinka jedinog naloga); po želji `ADMIN_EMAIL`
   (podrazumevano `ceka.mihajlo03@gmail.com`). Probni podaci se na serveru ne prave.
   Ceo spisak sa objašnjenjima: [`.env.example`](.env.example).
3. **Deploy the stack**. Build traje nekoliko minuta (Composer, pnpm, Vite).

Provera: `https://<domen>/up` vraća 200, `https://<domen>` otvara prijavu.

## 4. Posle prvog starta

1. Prijava sa `ADMIN_EMAIL` / `SECRET_PASSWORD` → **promeni lozinku** (profil).
2. **Podešavanja**: podaci firme (telefon, adresa, PIB…), podrazumevana marža i valuta, napomene na PDF-u.
3. **Korisnici**: nalozi za administratore i radnike (radnik ne vidi novac).
4. Na telefonu: otvori adresu u pregledaču → „Dodaj na početni ekran“ (PWA).

## 5. Ažuriranje

Push na granu sa koje Portainer deployuje → **Pull and redeploy** (ili Automatic updates).
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

## 7. Ako nešto ne radi

| Simptom | Uzrok / rešenje |
|---|---|
| stack neće da se digne, javlja koja promenljiva fali | dodaj je (vidi tačku 3) |
| `sparky-api` unhealthy, „Access denied“ u logu | `DB_PASSWORD` ne odgovara postojećem volumenu baze |
| nema sertifikata | DNS ne pokazuje na server ili port 80/443 nije otvoren |
| veliki video puca posle ~60 s | Traefik `respondingTimeouts.readTimeout` na serveru je prekratak – povećati (npr. 15m) |
| fiskalni račun „čeka preuzimanje“ | sajt Poreske uprave nije odgovarao; `sparky-schedule` pokušava svakog sata |
| PDF se ne pravi | `docker logs sparkylink_gotenberg`; servis mora biti gore |
