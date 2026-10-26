<?php

namespace App\Actions\Receipt\Shared;

use App\Classes\Utilities\PdfRenderer;
use App\Models\Receipt;
use App\Traits\Core\AsAction;
use chillerlan\QRCode\QRCode;
use chillerlan\QRCode\QROptions;
use Illuminate\Support\Facades\Storage;

class RenderReceiptCopyPdfAction
{
    use AsAction;

    public function __construct(
        private readonly PdfRenderer $pdfRenderer,
    ) {}

    /**
     * Kopija fiskalnog racuna za garanciju: tacan tekst racuna, QR kod za proveru na sajtu
     * Poreske uprave i slika racuna (ako postoji).
     */
    public function handle(Receipt $receipt): string
    {
        $qr = $receipt->qr_url
            ? (new QRCode(new QROptions(['outputBase64' => true, 'scale' => 4, 'quietzoneSize' => 2])))->render($receipt->qr_url)
            : null;

        $photo = $receipt->photo_path && Storage::disk('local')->exists($receipt->photo_path)
            ? PdfRenderer::imageDataUri(Storage::disk('local')->path($receipt->photo_path))
            : null;

        return $this->pdfRenderer->render('pdf.receipt-copy', [
            'receipt' => $receipt->loadMissing('site'),
            'qr' => $qr,
            'photo' => $photo,
        ]);
    }
}
