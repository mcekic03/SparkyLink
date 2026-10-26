@php
    /** @var \App\Models\Receipt $receipt */
    $money = fn ($value) => number_format((float) $value, 2, ',', '.');
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Kopija računa {{ $receipt->receipt_number }}</title>
    @include('pdf.styles')
    <style>
        .copy { display: flex; gap: 22px; align-items: flex-start; }
        .journal {
            font-family: "Liberation Mono", "DejaVu Sans Mono", "Noto Sans Mono", monospace;
            font-size: 9.5px; line-height: 1.35; white-space: pre; border: 1px dashed #9ca3af;
            padding: 12px 14px; background: #fff;
        }
        .side { flex: 1; font-size: 10.5px; }
        .side img.qr { width: 150px; height: 150px; }
        .photo { page-break-before: always; text-align: center; }
        .photo img { max-width: 100%; max-height: 980px; }
    </style>
</head>
<body>
<h1 class="title" style="font-size: 20px; margin: 0 0 4px;">KOPIJA FISKALNOG RAČUNA</h1>
<p class="muted" style="margin: 0 0 14px;">
    Tekst računa preuzet je sa sistema Poreske uprave (suf.purs.gov.rs). Autentičnost se proverava skeniranjem QR koda.
</p>

<div class="copy">
    @if ($receipt->journal)
        <div class="journal">{{ $receipt->journal }}</div>
    @endif
    <div class="side">
        <p><strong>{{ $receipt->store_name ?: 'Prodavnica nije poznata' }}</strong><br>
            @if ($receipt->store_tin)PIB: {{ $receipt->store_tin }}<br>@endif
            {{ collect([$receipt->store_address, $receipt->store_city])->filter()->implode(', ') }}</p>
        <p>
            @if ($receipt->receipt_number)Broj računa: <strong>{{ $receipt->receipt_number }}</strong><br>@endif
            @if ($receipt->issued_at)Datum: {{ $receipt->issued_at->format('d.m.Y. H:i') }}<br>@endif
            @if ($receipt->total_amount)Ukupno: <strong>{{ $money($receipt->total_amount) }} din</strong><br>@endif
            Gradilište: {{ $receipt->site?->name }}
        </p>
        @if ($qr)
            <img class="qr" src="{{ $qr }}" alt="QR kod za proveru računa">
            <p class="muted" style="font-size: 9px;">Skenirajte QR kod za proveru na sajtu Poreske uprave.</p>
        @endif
        @if ($receipt->note)
            <div class="note">{{ $receipt->note }}</div>
        @endif
    </div>
</div>

@if ($photo)
    <div class="photo">
        <p class="muted">Slika originalnog računa</p>
        <img src="{{ $photo }}" alt="Slika računa">
    </div>
@endif

<div class="footer">Kreirano pomoću SparkyLink sistema</div>
</body>
</html>
