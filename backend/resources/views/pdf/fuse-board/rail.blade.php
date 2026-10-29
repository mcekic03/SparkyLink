{{-- Izgled 2: osiguraci nacrtani kao moduli na DIN sini, 12 u redu, kao u ormaru. --}}
@extends('pdf.fuse-board.layout')

@section('styles')
    .head { display: flex; align-items: center; gap: 20px; padding-bottom: 10px; border-bottom: 4px solid #fdba12; }
    .head img { height: 62px; }
    .title { flex: 1; }
    .title h1 { margin: 0; font-size: 26px; letter-spacing: 2px; line-height: 1.1; }
    .title .sub { margin-top: 4px; font-size: 15px; font-weight: 700; color: #5a5c6c; }
    .meta { display: grid; grid-template-columns: auto auto auto; gap: 2px 24px; }
    .meta span { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #5a5c6c; }
    .meta b { font-size: 12px; }
    .cabinet { margin-top: 16px; border: 2.5px solid #131430; border-radius: 16px; padding: 22px 24px 2px; background: linear-gradient(180deg, #f5f6fa, #eceef4); }
    .rail-row { position: relative; margin-bottom: 22px; }
    .rail { position: absolute; left: -12px; right: -12px; top: 64px; height: 22px; background: repeating-linear-gradient(90deg, #c9ccd8 0 15px, #aeb1c1 15px 18px); border-top: 2px solid #9a9db0; border-bottom: 2px solid #9a9db0; }
    .mods { position: relative; display: flex; gap: 8px; }
    .mod { width: 74px; }
    .unit { height: 152px; background: #fff; border: 1.5px solid #131430; border-radius: 7px; display: flex; flex-direction: column; align-items: center; padding-top: 8px; box-shadow: 0 3px 0 rgba(19, 20, 48, .12); }
    .num { width: 32px; height: 32px; line-height: 32px; border-radius: 50%; background: #131430; color: #fff; font-weight: 700; font-size: 15px; text-align: center; }
    .lever { margin-top: 12px; width: 26px; height: 44px; border-radius: 4px; background: #e8e9ef; border: 1px solid #b7bac8; position: relative; }
    .lever i { position: absolute; left: 3px; right: 3px; top: 3px; height: 19px; border-radius: 3px; background: #131430; }
    .rating { margin-top: auto; width: 100%; text-align: center; padding: 6px 0 7px; border-radius: 0 0 5px 5px; font-weight: 700; font-size: 16px; }
    .B .rating { background: #fdba12; }
    .C .rating { background: #131430; color: #fdba12; }
    .label { margin-top: 7px; height: 42px; overflow: hidden; text-align: center; font-size: 10.5px; font-weight: 700; line-height: 1.25; word-wrap: break-word; }
    .bottom { margin-top: 12px; display: flex; gap: 26px; font-size: 10px; color: #5a5c6c; }
    .bottom .contact { margin-left: auto; }
@endsection

@section('content')
@foreach ($pages as $page)
    <div class="page">
        <div class="head">
            @if ($logo)<img src="{{ $logo }}" alt="{{ $company['name'] }}">@endif
            <div class="title">
                <h1>RASPORED OSIGURAČA</h1>
                <div class="sub">{{ $board }}@if (count($pages) > 1) · strana {{ $loop->iteration }}/{{ count($pages) }}@endif</div>
            </div>
            <div class="meta">
                <div><span>Investitor</span><b>{{ $investor ?: '—' }}</b></div>
                <div><span>Gradilište</span><b>{{ collect([$siteName, $siteAddress])->filter()->implode(', ') }}</b></div>
                <div><span>Datum</span><b>{{ $date }}</b></div>
            </div>
        </div>

        @if ($count === 0)
            <div class="cabinet"><div class="empty" style="margin-bottom: 20px">Na ovoj tabli još nema osigurača.</div></div>
        @else
            <div class="cabinet">
                @foreach (array_chunk($page, 12) as $rail)
                    <div class="rail-row">
                        <div class="rail"></div>
                        <div class="mods">
                            @foreach ($rail as $fuse)
                                <div class="mod {{ $fuse['type'] }}">
                                    <div class="unit">
                                        <div class="num">{{ $fuse['number'] }}</div>
                                        <div class="lever"><i></i></div>
                                        <div class="rating">{{ $fuse['type'] }}{{ $fuse['rating'] }}</div>
                                    </div>
                                    <div class="label">{{ $fuse['name'] }}</div>
                                </div>
                            @endforeach
                        </div>
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
