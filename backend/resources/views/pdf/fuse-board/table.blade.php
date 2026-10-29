{{-- Izgled 1: tabela u dve kolone. --}}
@extends('pdf.fuse-board.layout')

@section('styles')
    .head { display: flex; align-items: center; gap: 22px; padding-bottom: 12px; border-bottom: 4px solid #fdba12; }
    .head img { height: 74px; }
    .title { flex: 1; }
    .title h1 { margin: 0; font-size: 29px; letter-spacing: 2px; line-height: 1.1; }
    .title .sub { margin-top: 7px; display: inline-block; background: #fdba12; font-weight: 700; font-size: 15px; padding: 3px 14px; border-radius: 6px; }
    .company { text-align: right; font-size: 10.5px; color: #5a5c6c; line-height: 1.5; }
    .company strong { color: #131430; font-size: 14px; }
    .info { display: grid; grid-template-columns: 1fr 1.7fr .7fr .7fr; gap: 10px; margin: 12px 0 14px; }
    .box { border: 1px solid #e3e4ea; border-radius: 8px; padding: 6px 12px; }
    .box span { display: block; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: #5a5c6c; }
    .box b { font-size: 13px; }
    .box i { font-style: normal; color: #5a5c6c; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #131430; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; padding: 7px 10px; text-align: left; }
    th:first-child { border-radius: 6px 0 0 0; width: 54px; text-align: center; }
    th:last-child { border-radius: 0 6px 0 0; width: 100px; text-align: center; }
    td { height: 49px; padding: 0 10px; border-bottom: 1px solid #e3e4ea; font-size: 14px; font-weight: 700; }
    tr:nth-child(even) td { background: #f7f7fa; }
    td.no, td.fz { text-align: center; }
    td.no b { display: inline-block; width: 34px; height: 34px; line-height: 34px; border-radius: 8px; background: #131430; color: #fff; font-size: 15px; }
    td .pill { padding: 5px 12px; font-size: 13.5px; min-width: 76px; }
    .dense td { height: 36px; font-size: 12.5px; }
    .dense td.no b { width: 28px; height: 28px; line-height: 28px; font-size: 13px; }
    .dense td .pill { padding: 3px 10px; font-size: 12px; }
    .legend { margin-top: 12px; }
@endsection

@section('content')
@foreach ($pages as $page)
    @php($half = (int) ceil(count($page) / 2))
    <div class="page">
        <div class="head">
            @if ($logo)<img src="{{ $logo }}" alt="{{ $company['name'] }}">@endif
            <div class="title">
                <h1>RASPORED OSIGURAČA</h1>
                <div class="sub">{{ $board }}</div>
            </div>
            <div class="company">
                <strong>{{ $company['name'] }}</strong>
                @if ($company['contact'])<br>{{ $company['contact'] }}@endif
            </div>
        </div>

        <div class="info">
            <div class="box"><span>Investitor</span><b>{{ $investor ?: '—' }}</b></div>
            <div class="box"><span>Gradilište</span><b>{{ $siteName }}</b>@if ($siteAddress) <i>· {{ $siteAddress }}</i>@endif</div>
            <div class="box"><span>Datum</span><b>{{ $date }}</b></div>
            <div class="box">
                <span>Osigurača</span><b>{{ $count }}</b>
                @if (count($pages) > 1) <i>· strana {{ $loop->iteration }}/{{ count($pages) }}</i>@endif
            </div>
        </div>

        @if ($count === 0)
            <div class="empty">Na ovoj tabli još nema osigurača.</div>
        @else
            <div class="cols {{ $count > 18 ? 'dense' : '' }}">
                @foreach (array_filter([array_slice($page, 0, $half), array_slice($page, $half)]) as $column)
                    <table>
                        <thead><tr><th>Br.</th><th>Šta napaja</th><th>Osigurač</th></tr></thead>
                        <tbody>
                        @foreach ($column as $fuse)
                            <tr>
                                <td class="no"><b>{{ $fuse['number'] }}</b></td>
                                <td>{{ $fuse['name'] }}</td>
                                <td class="fz"><span class="pill {{ $fuse['type'] }}">{{ $fuse['type'] }} {{ $fuse['rating'] }} A</span></td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                @endforeach
            </div>
        @endif

        <div class="legend">@include('pdf.fuse-board.legend')</div>
    </div>
@endforeach
@endsection
