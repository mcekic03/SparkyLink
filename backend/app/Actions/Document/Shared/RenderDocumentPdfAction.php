<?php

namespace App\Actions\Document\Shared;

use App\Classes\Utilities\PdfRenderer;
use App\Models\Document;
use App\Models\Setting;
use App\Traits\Core\AsAction;

class RenderDocumentPdfAction
{
    use AsAction;

    public function __construct(
        private readonly PdfRenderer $pdfRenderer,
    ) {}

    /**
     * PDF ponude ili zavrsnog racuna iz sacuvanog snimka (isti izgled, razlikuju se naslov i poruka).
     */
    public function handle(Document $document): string
    {
        return $this->pdfRenderer->render('pdf.document', [
            'doc' => $document->snapshot,
            'isOffer' => $document->type->value === 1,
            'logo' => PdfRenderer::imageDataUri(Setting::logoPath()),
        ]);
    }
}
