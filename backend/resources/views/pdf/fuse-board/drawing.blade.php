{{-- Izgled 4: sema izvoda (sabirnica -> osigurac -> potrosac) sa tablicom podataka, kao list iz projekta. --}}
@extends('pdf.fuse-board.layout')

@section('styles')
    .frame { height: 688px; border: 2px solid #131430; padding: 5px; }
    .inner { height: 100%; border: 0.8px solid #131430; position: relative; padding: 16px 18px; }
    .top { display: flex; align-items: baseline; gap: 16px; }
    .top h1 { margin: 0; font-size: 24px; letter-spacing: 2px; }
    .top .sub { font-size: 15px; font-weight: 700; color: #5a5c6c; }
    .diagram { display: block; margin-top: 14px; }
    .side { position: absolute; left: 18px; bottom: 16px; display: flex; flex-direction: column; gap: 5px; }
    .made { font-size: 8.5px; color: #8e90a2; margin-top: 4px; }
    .block { position: absolute; right: -0.8px; bottom: -0.8px; width: 560px; border-collapse: collapse; }
    .block td { border: 0.8px solid #131430; padding: 4px 8px; vertical-align: top; }
    .block span { display: block; font-size: 7.5px; text-transform: uppercase; letter-spacing: 1px; color: #5a5c6c; }
    .block b { font-size: 11.5px; }
    .block .brand { width: 150px; text-align: center; vertical-align: middle; }
    .block .brand img { height: 62px; }
    .block .drawing-name { font-size: 15px; letter-spacing: 1px; }
@endsection

@section('content')
@foreach ($pages as $page)
    @php
        $width = 980;
        $step = min(54, ($width - 70) / max(count($page), 1));
        $busY = 34;
        $lastX = 50 + $step * max(count($page) - 1, 0);
    @endphp
    <div class="page frame">
        <div class="inner">
            <div class="top">
                <h1>RASPORED OSIGURAČA</h1>
                <span class="sub">{{ $board }}</span>
            </div>

            @if ($count === 0)
                <div class="empty" style="margin-top: 30px">Na ovoj tabli još nema osigurača.</div>
            @else
                <svg class="diagram" width="{{ $width }}" height="440" viewBox="0 0 {{ $width }} 440" xmlns="http://www.w3.org/2000/svg">
                    <line x1="20" y1="{{ $busY }}" x2="{{ $lastX + 22 }}" y2="{{ $busY }}" stroke="#131430" stroke-width="5" stroke-linecap="round"/>
                    <text x="20" y="{{ $busY - 10 }}" font-size="9" fill="#5a5c6c" letter-spacing="1">SABIRNICA</text>
                    @foreach ($page as $index => $fuse)
                        @php
                            $x = 50 + $step * $index;
                            $isB = $fuse['type'] === 'B';
                            $badge = $fuse['rating'] >= 10 ? 29 : 23;
                        @endphp
                        <line x1="{{ $x }}" y1="{{ $busY }}" x2="{{ $x }}" y2="112" stroke="#131430" stroke-width="1.7"/>
                        <circle cx="{{ $x }}" cy="72" r="13" fill="#fdba12" stroke="#131430" stroke-width="1.5"/>
                        <text x="{{ $x }}" y="76.5" font-size="{{ $fuse['number'] >= 100 ? 9 : 12 }}" font-weight="700" text-anchor="middle" fill="#131430">{{ $fuse['number'] }}</text>
                        <line x1="{{ $x - 6 }}" y1="106" x2="{{ $x + 6 }}" y2="118" stroke="#131430" stroke-width="1.7"/>
                        <line x1="{{ $x - 6 }}" y1="118" x2="{{ $x + 6 }}" y2="106" stroke="#131430" stroke-width="1.7"/>
                        <line x1="{{ $x }}" y1="152" x2="{{ $x - 15 }}" y2="116" stroke="#131430" stroke-width="2"/>
                        <line x1="{{ $x }}" y1="152" x2="{{ $x }}" y2="196" stroke="#131430" stroke-width="1.7"/>
                        <rect x="{{ $x + 5 }}" y="124" width="{{ $badge }}" height="16" rx="3" fill="{{ $isB ? '#fdba12' : '#131430' }}"/>
                        <text x="{{ $x + 5 + $badge / 2 }}" y="135.5" font-size="10" font-weight="700" text-anchor="middle" fill="{{ $isB ? '#131430' : '#fdba12' }}">{{ $fuse['type'] }}{{ $fuse['rating'] }}</text>
                        <path d="M {{ $x - 5 }} 194 L {{ $x }} 203 L {{ $x + 5 }} 194 Z" fill="#131430"/>
                        <text transform="translate({{ $x + 5 }} 212) rotate(90)" font-size="12.5" font-weight="700" fill="#131430" @if (mb_strlen($fuse['name']) > 30) textLength="226" lengthAdjust="spacingAndGlyphs" @endif>{{ $fuse['name'] }}</text>
                    @endforeach
                </svg>
            @endif

            <div class="side">
                <div class="legend" style="flex-direction: column; gap: 5px">@include('pdf.fuse-board.legend')</div>
                <div class="made">Kreirano pomoću SparkyLink sistema</div>
            </div>

            <table class="block">
                <tr>
                    <td class="brand" rowspan="3">
                        @if ($logo)<img src="{{ $logo }}" alt="{{ $company['name'] }}">@else<b>{{ $company['name'] }}</b>@endif
                    </td>
                    <td colspan="2"><span>Investitor</span><b>{{ $investor ?: '—' }}</b></td>
                    <td><span>Datum</span><b>{{ $date }}</b></td>
                </tr>
                <tr>
                    <td colspan="3"><span>Objekat</span><b>{{ collect([$siteName, $siteAddress])->filter()->implode(', ') }}</b></td>
                </tr>
                <tr>
                    <td colspan="2"><span>Ormar</span><b>{{ $board }}</b></td>
                    <td>
                        <span>Osigurača</span><b>{{ $count }}</b>
                        @if (count($pages) > 1)<span>strana {{ $loop->iteration }}/{{ count($pages) }}</span>@endif
                    </td>
                </tr>
                <tr>
                    <td><span>Izvođač</span><b>{{ $company['name'] }}</b>@if ($company['contact'])<span>{{ $company['contact'] }}</span>@endif</td>
                    <td colspan="3"><span>Naziv crteža</span><b class="drawing-name">RASPORED OSIGURAČA</b></td>
                </tr>
            </table>
        </div>
    </div>
@endforeach
@endsection

@section('footer')
@endsection
