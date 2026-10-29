# SparkyLink — plan izrade

**Cilj:** interni softver za gradilišta (Cekić Elektrik) — stavke, rad, uplate, obračun PDF, fiskalni računi, mediji, u EUR i RSD.
**Arhitektura:** Laravel 12 API (`backend/`, Larastarter, `backend/CLAUDE.md`) + React SPA (`frontend/`, šablon iz Stare Vodenice, `frontend/CLAUDE.md`), jedan Docker stek.
**Specifikacija:** `docs/superpowers/specs/2026-10-26-sparkylink-design.md`

## Zadaci

- [x] 1. Docker stek: `docker-compose.yml` (prod), `docker-compose.override.yml` (lokalni Traefik, portovi, alati), Dockerfile-ovi, nginx, MySQL init, backup.
- [x] 2. Backend osnova: čišćenje šablona, uloge 1–3, podešavanja, prevodi, Pest zelen.
- [x] 3. Kurs (`exchange_rates`, preuzimanje, komanda, ruta) + testovi.
- [x] 4. Gradilišta + napomene + testovi (pretraga, filter, soft delete, radnik bez iznosa).
- [x] 5. Stavke + cenovnik + predlozi + testovi (oba iznosa, zarez u decimalama, kurs).
- [x] 6. Rad radnika + uplate + sažetak gradilišta + testovi (dug u valuti obračuna).
- [x] 7. Obračun (snimak + PDF preko Gotenberga) + testovi.
- [x] 8. Fiskalni računi (preuzimanje sa suf.purs.gov.rs, pregled, uvoz, duplikat, ručni, kopija PDF, ponovni pokušaj) + testovi.
- [x] 9. Slike i video (otpremanje, sličice, potpisani linkovi) + testovi.
- [x] 10. Pregled (analitika) + podešavanja i logo + testovi.
- [x] 11. Frontend osnova: čišćenje šablona, isti domen za API, uloge, navigacija, prevodi.
- [x] 12. Frontend ekrani: gradilišta, stavke, rad, uplate, obračuni, računi i skener, mediji, napomene, cenovnik, pregled, podešavanja, korisnici; PWA.
- [x] 13. Ceo stek lokalno + pristup sa telefona + probni podaci + provera u pregledaču.
- [x] 14. README, DEPLOYMENT, `docs/API.md`, `CLAUDE.md`; završni pregled koda.

## Na šta posebno paziti

1. Kurs nedostupan (servis pao, vikend, budući datum) → unos i dalje moguć uz ručni kurs.
2. Isti fiskalni račun skeniran dvaput → upozorenje, bez duplih stavki.
3. Decimalni zarez sa telefona (`12,5`) → prihvata se.
4. Radnik ne dobija novčana polja ni preko API-ja.
5. Veliki video (stotine MB) → napredak otpremanja i jasna greška kad je prevelik.
