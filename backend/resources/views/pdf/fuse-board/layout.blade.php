{{--
    Zajednicki okvir za sva cetiri izgleda rasporeda osiguraca. A4 polozeno: sadrzaj strane je
    oko 1036 x 698 px (margine iz PdfRenderer-a). Boje firme: zuta #FDBA12 i tamnoplava #131430;
    B osiguraci su zuti, C tamnoplavi.
--}}
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <title>Raspored osigurača – {{ $board }}</title>
    <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body {
            font-family: "Inter", "Noto Sans", "Liberation Sans", "DejaVu Sans", Arial, sans-serif;
            font-size: 11px;
            color: #131430;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .page + .page { page-break-before: always; }
        .pill { display: inline-block; white-space: nowrap; border-radius: 999px; font-weight: 700; letter-spacing: .3px; }
        .pill.B { background: #fdba12; color: #131430; }
        .pill.C { background: #131430; color: #fdba12; }
        .legend { display: flex; gap: 26px; font-size: 10px; color: #5a5c6c; }
        .legend .pill { padding: 1px 8px; margin-right: 4px; font-size: 10px; }
        .empty { padding: 40px; text-align: center; color: #5a5c6c; border: 1px dashed #c9cbd6; border-radius: 8px; font-size: 13px; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8.5px; color: #8e90a2; }
        @yield('styles')
    </style>
</head>
<body>
@yield('content')
@section('footer')
    <div class="footer">Kreirano pomoću SparkyLink sistema</div>
@show
</body>
</html>
