# SparkyLink – uputstvo za rad na projektu

Interni softver firme Cekić Elektrik za gradilišta (naziv aplikacije: **SparkyLink**, ne „MS“ ni „sparky“).
Sva komunikacija, dokumentacija, komentari i commit poruke na srpskom (ekavica); identifikatori u kodu
na engleskom.

- **Backend** (`backend/`): pravila u [`backend/CLAUDE.md`](backend/CLAUDE.md) (Larastarter / CLAUDE_ULTIMATE)
  su primarna – `LocalizedFormRequest` + `Ruly`, akcije sa `AsAction`, `response()->success()`, resursi,
  enumi od 1, `dateTime()` + `_at`.
- **Frontend** (`frontend/`): pravila u [`frontend/CLAUDE.md`](frontend/CLAUDE.md) – TanStack Router/Query/Form,
  zod, shadcn iz `@app/ui`, `logOnFail`, prevodi u oba jezika (`sr.json`, `en.json`).
- **Stek i server**: [`DEPLOYMENT.md`](DEPLOYMENT.md); lokalno [`README.md`](README.md).
- **Specifikacija i odluke**: [`docs/superpowers/specs/2026-10-26-sparkylink-design.md`](docs/superpowers/specs/2026-10-26-sparkylink-design.md).

## Pravila domena (ne kršiti)

- Novac: `DECIMAL`, računanje kroz `App\Classes\Utilities\Money` (brick/math), nikad float. Svaki zapis
  čuva valutu unosa, kurs dana i oba iznosa; izveštaji sabiraju sačuvane kolone.
- Radnik (`role_id` 3) ne sme da dobije novčana polja – ni kroz API (resursi, rute `role:super-admin,admin`).
- Dokumenti za investitora (ponuda, završni račun) su snimci – kasnije izmene stavki ih ne menjaju.
  PDF nikad ne sadrži nabavne cene ni zaradu; u dnu stoji „Kreirano pomoću SparkyLink sistema“.
- Van obima: PDV, SEF, fiskalizacija i zakonsko poslovanje firme.

## Izgled

- Boje firme sa logoa: žuta `#FDBA12` je glavna boja (dugmad, oznake, aktivne stavke), tamnoplava
  `#131430` je boja teksta. Tema aplikacije je u `frontend/apps/web/src/styles.css` (prepisuje temu iz
  `@app/ui`, koja se ne dira), PDF u `backend/resources/views/pdf/styles.blade.php`.
- Puna žuta se ne koristi za tekst ni tanke linije na beloj podlozi (kontrast 1,7:1); za to služi
  `--brand-deep` / `text-brand-deep`.

## Provere pre završetka

```bash
docker compose run --rm sparky-dev php artisan test
docker compose run --rm --no-deps sparky-node sh -c "cd apps/web && npx tsc --noEmit && npx oxlint --type-aware && npx vitest run && npx vite build"
```

`git commit`, `push`, `pull` i `merge` samo na izričit zahtev vlasnika, bez potpisa alata u porukama.
