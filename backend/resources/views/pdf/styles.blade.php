<style>
    /* Boje firme sa logoa: zuta #FDBA12 i tamnoplava #131430. */
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
        font-family: "Inter", "Noto Sans", "Liberation Sans", "DejaVu Sans", Arial, sans-serif;
        font-size: 10.5px;
        color: #131430;
        line-height: 1.45;
    }
    .muted { color: #5a5c6c; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 4px solid #fdba12; }
    .header img { height: 78px; }
    .company { text-align: right; font-size: 10px; line-height: 1.5; }
    .company strong { font-size: 13px; }
    .title-row { display: flex; justify-content: space-between; align-items: flex-end; margin: 18px 0 14px; }
    .title { font-size: 26px; font-weight: 800; letter-spacing: 1px; margin: 0; }
    .title small { font-size: 14px; font-weight: 600; color: #5a5c6c; letter-spacing: 0; margin-left: 6px; }
    .meta { text-align: right; font-size: 10.5px; }
    .parties { display: flex; gap: 14px; margin-bottom: 14px; }
    .party { flex: 1; border: 1px solid #e3e4ea; border-radius: 6px; padding: 9px 11px; }
    .party h4 { margin: 0 0 4px; font-size: 9px; text-transform: uppercase; letter-spacing: .8px; color: #5a5c6c; }
    .party .name { font-weight: 700; font-size: 12px; }
    .notice { border: 2px solid #fdba12; background: #fff6dc; border-radius: 6px; padding: 11px 13px; margin: 0 0 16px; font-size: 13.5px; font-weight: 700; line-height: 1.5; }
    .notice span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #131430; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; }
    .group-title { font-size: 12px; font-weight: 700; margin: 14px 0 5px; }
    .items th { background: #131430; color: #fff; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; padding: 6px 6px; text-align: left; }
    .items td { padding: 5px 6px; border-bottom: 1px solid #e3e4ea; vertical-align: top; }
    .items tr:nth-child(even) td { background: #f7f7fa; }
    .num { text-align: right !important; white-space: nowrap; }
    .subtotal td { font-weight: 700; background: #fff1c9 !important; border-bottom: 0; }
    .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
    .totals table { width: 56%; }
    .totals td { padding: 5px 8px; }
    .totals .grand td { font-size: 14px; font-weight: 800; border-top: 2px solid #131430; }
    .totals .due td { font-size: 15px; font-weight: 800; background: #fdba12; color: #131430; }
    .rate { margin-top: 8px; font-size: 9.5px; text-align: right; }
    .note { margin-top: 14px; padding: 9px 11px; background: #f2f2f6; border-radius: 6px; white-space: pre-line; }
    .signatures { display: flex; justify-content: space-between; margin-top: 46px; }
    .signatures div { width: 38%; border-top: 1px solid #131430; padding-top: 5px; text-align: center; font-size: 10px; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8.5px; color: #8e90a2; }
    .avoid-break { page-break-inside: avoid; }
</style>
