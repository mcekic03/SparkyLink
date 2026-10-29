{{-- Izgled 3: tamno zaglavlje i kartica za svaki osigurac, 6 u redu. --}}
@extends('pdf.fuse-board.layout')

@php
    // Prozirni logo (PNG, SVG) se boji u zuto preko maske; ostali idu na belu podlogu.
    $maskLogo = $logo && (str_starts_with($logo, 'data:image/png') || str_starts_with($logo, 'data:image/svg'));
@endphp

@section('styles')
    .band { display: flex; align-items: center; gap: 24px; background: #131430; color: #fff; border-radius: 14px; padding: 16px 26px; border-bottom: 6px solid #fdba12; }
    .mlogo { width: 88px; height: 75px; flex-shrink: 0; background: #fdba12; -webkit-mask: url("{{ $logo }}") center / contain no-repeat; mask: url("{{ $logo }}") center / contain no-repeat; }
    .plain-logo { background: #fff; border-radius: 10px; padding: 6px; flex-shrink: 0; }
    .plain-logo img { height: 63px; display: block; }
    .t { flex: 1; }
    .t h1 { margin: 0; font-size: 30px; letter-spacing: 2px; line-height: 1.1; }
    .t .sub { margin-top: 5px; color: #fdba12; font-size: 16px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: auto auto; gap: 6px 28px; }
    .meta span { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #a9abc4; }
    .meta b { font-size: 12px; }
    .meta .full { grid-column: 1 / -1; }
    .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-top: 18px; }
    .card { height: 150px; border: 1px solid #e3e4ea; border-top: 6px solid #fdba12; border-radius: 10px; padding: 10px 12px 11px; display: flex; flex-direction: column; background: #fff; }
    .card.C { border-top-color: #131430; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 6px; }
    .n { font-size: 38px; font-weight: 700; line-height: 1; }
    .top .pill { padding: 4px 11px; font-size: 12.5px; }
    .name { margin-top: auto; max-height: 72px; overflow: hidden; font-size: 14px; font-weight: 700; line-height: 1.25; word-wrap: break-word; }
    .bottom { margin-top: 14px; }
    .bottom .contact { margin-left: auto; }
@endsection

@section('content')
@foreach ($pages as $page)
    <div class="page">
        <div class="band">
            @if ($maskLogo)
                <div class="mlogo"></div>
            @elseif ($logo)
                <div class="plain-logo"><img src="{{ $logo }}" alt="{{ $company['name'] }}"></div>
            @endif
            <div class="t">
                <h1>RASPORED OSIGURAČA</h1>
                <div class="sub">{{ $board }}@if (count($pages) > 1) · strana {{ $loop->iteration }}/{{ count($pages) }}@endif</div>
            </div>
            <div class="meta">
                <div><span>Investitor</span><b>{{ $investor ?: '—' }}</b></div>
                <div><span>Datum</span><b>{{ $date }}</b></div>
                <div class="full"><span>Gradilište</span><b>{{ collect([$siteName, $siteAddress])->filter()->implode(' · ') }}</b></div>
            </div>
        </div>

        @if ($count === 0)
            <div class="empty" style="margin-top: 18px">Na ovoj tabli još nema osigurača.</div>
        @else
            <div class="grid">
                @foreach ($page as $fuse)
                    <div class="card {{ $fuse['type'] }}">
                        <div class="top">
                            <span class="n">{{ $fuse['number'] }}</span>
                            <span class="pill {{ $fuse['type'] }}">{{ $fuse['type'] }} {{ $fuse['rating'] }} A</span>
                        </div>
                        <div class="name">{{ $fuse['name'] }}</div>
                    </div>
                @endforeach
            </div>
        @endif

        <div class="bottom legend">
            @include('pdf.fuse-board.legend')
            <span class="contact">{{ collect([$company['name'], $company['contact']])->filter()->implode(' · ') }}</span>
        </div>
    </div>
@endforeach
@endsection
