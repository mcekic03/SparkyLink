@php
    /** @var array $doc */
    $money = fn ($value) => number_format((float) $value, 2, ',', '.');
    $qty = fn ($value) => rtrim(rtrim(number_format((float) $value, 3, ',', '.'), '0'), ',');
    $day = fn (?string $value) => $value ? \Illuminate\Support\Carbon::parse($value)->format('d.m.Y.') : '';
    $cur = $doc['currency_symbol'];
    $otherCur = $doc['other_currency_symbol'];
    $company = $doc['company'];
    $rowNumber = 0;
@endphp
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>{{ $doc['title'] }} {{ $doc['number'] }}</title>
    @include('pdf.styles')
</head>
<body>
<div class="header">
    <div>
        @if ($logo)
            <img src="{{ $logo }}" alt="{{ $company['name'] }}">
        @else
            <strong style="font-size: 20px;">{{ $company['name'] }}</strong>
        @endif
    </div>
    <div class="company">
        <strong>{{ $company['name'] }}</strong><br>
        @if ($company['address']){{ $company['address'] }}@if ($company['city']), {{ $company['city'] }}@endif<br>@endif
        @if ($company['phone'])Tel: {{ $company['phone'] }}<br>@endif
        @if ($company['email']){{ $company['email'] }}<br>@endif
        @if ($company['website']){{ $company['website'] }}<br>@endif
        @if ($company['pib'])PIB: {{ $company['pib'] }}@if ($company['mb']) &nbsp;·&nbsp; MB: {{ $company['mb'] }}@endif<br>@endif
        @if ($company['bank_account'])Tekući račun: {{ $company['bank_account'] }}@endif
    </div>
</div>

<div class="title-row">
    <h1 class="title">{{ $doc['title'] }} <small>br. {{ $doc['number'] }}</small></h1>
    <div class="meta">
        Datum: <strong>{{ $day($doc['issued_at']) }}</strong><br>
        Valuta: {{ $doc['currency'] }}
    </div>
</div>

<div class="parties">
    <div class="party">
        <h4>Investitor</h4>
        <div class="name">{{ $doc['investor']['name'] ?: '—' }}</div>
        @if ($doc['investor']['address']){{ $doc['investor']['address'] }}<br>@endif
        @if ($doc['investor']['phone'])Tel: {{ $doc['investor']['phone'] }}<br>@endif
        @if ($doc['investor']['email']){{ $doc['investor']['email'] }}@endif
    </div>
    <div class="party">
        <h4>Gradilište</h4>
        <div class="name">{{ $doc['site']['name'] }}</div>
        {{ collect([$doc['site']['address'], $doc['site']['city']])->filter()->implode(', ') }}
    </div>
</div>

@if ($isOffer && $doc['notice'])
    <div class="notice avoid-break">
        <span>Važna napomena</span>
        {{ $doc['notice'] }}
    </div>
@endif

@foreach ($doc['groups'] as $group)
    <div class="group-title">{{ $group['label'] }}</div>
    <table class="items">
        <thead>
        <tr>
            <th style="width: 5%;">R.br.</th>
            <th>Opis</th>
            <th style="width: 8%;">J.m.</th>
            <th class="num" style="width: 10%;">Količina</th>
            <th class="num" style="width: 13%;">Cena ({{ $cur }})</th>
            <th class="num" style="width: 14%;">Iznos ({{ $cur }})</th>
            <th class="num" style="width: 15%;">Iznos ({{ $otherCur }})</th>
        </tr>
        </thead>
        <tbody>
        @foreach ($group['lines'] as $line)
            <tr>
                <td>{{ ++$rowNumber }}.</td>
                <td>{{ $line['name'] }}</td>
                <td>{{ $line['unit'] }}</td>
                <td class="num">{{ $qty($line['quantity']) }}</td>
                <td class="num">{{ $money($line['unit_price']) }}</td>
                <td class="num">{{ $money($line['amount']) }}</td>
                <td class="num muted">{{ $money($line['amount_other']) }}</td>
            </tr>
        @endforeach
        <tr class="subtotal">
            <td colspan="5">Ukupno – {{ mb_strtolower($group['label']) }}</td>
            <td class="num">{{ $money($group['subtotal']) }}</td>
            <td class="num">{{ $money($group['subtotal_other']) }}</td>
        </tr>
        </tbody>
    </table>
@endforeach

<div class="totals avoid-break">
    <table>
        <tr class="grand">
            <td>{{ $isOffer ? 'UKUPNO PO PONUDI' : 'UKUPNO' }}</td>
            <td class="num">{{ $money($doc['total']) }} {{ $cur }}</td>
            <td class="num">{{ $money($doc['total_other']) }} {{ $otherCur }}</td>
        </tr>
        @unless ($isOffer)
            @foreach ($doc['payments'] as $payment)
                <tr>
                    <td class="muted">Uplata {{ $day($payment['paid_at']) }}@if ($payment['note']) – {{ $payment['note'] }}@endif</td>
                    <td class="num">− {{ $money($payment['amount']) }} {{ $cur }}</td>
                    <td></td>
                </tr>
            @endforeach
            <tr class="due">
                <td>PREOSTALO ZA UPLATU</td>
                <td class="num">{{ $money($doc['balance']) }} {{ $cur }}</td>
                <td class="num">{{ $money($doc['balance_other']) }} {{ $otherCur }}</td>
            </tr>
        @endunless
    </table>
</div>
<div class="rate muted">
    Iznosi u drugoj valuti su preračunati po srednjem kursu NBS na dan {{ $day($doc['issued_at']) }}:
    1 € = {{ number_format((float) $doc['exchange_rate'], 4, ',', '.') }} din
</div>

@if ($doc['note'])
    <div class="note">{{ $doc['note'] }}</div>
@endif
@if (! $isOffer && $doc['footer_note'])
    <div class="note">{{ $doc['footer_note'] }}</div>
@endif

<div class="signatures avoid-break">
    <div>Izvođač radova<br><span class="muted">{{ $company['name'] }}</span></div>
    <div>Investitor<br><span class="muted">{{ $doc['investor']['name'] ?: '' }}</span></div>
</div>

<div class="footer">Kreirano pomoću SparkyLink sistema</div>
</body>
</html>
