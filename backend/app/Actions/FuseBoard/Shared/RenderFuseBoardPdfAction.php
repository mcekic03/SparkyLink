<?php

namespace App\Actions\FuseBoard\Shared;

use App\Classes\Utilities\PdfRenderer;
use App\Enums\FuseBoardTemplate;
use App\Models\Fuse;
use App\Models\FuseBoard;
use App\Models\Setting;
use App\Traits\Core\AsAction;

class RenderFuseBoardPdfAction
{
    use AsAction;

    public function __construct(
        private readonly PdfRenderer $pdfRenderer,
    ) {}

    /**
     * Raspored osiguraca table u izabranom izgledu (A4 polozeno), od trenutno sacuvanih podataka.
     * Osiguraci koji ne stanu na jednu stranu prelaze na sledecu, sa istim zaglavljem.
     */
    public function handle(FuseBoard $board, FuseBoardTemplate $template): string
    {
        $board->loadMissing(['site', 'fuses']);
        $site = $board->site;
        $company = Setting::company();

        $fuses = $board->fuses->map(fn (Fuse $fuse) => [
            'number' => $fuse->position,
            'name' => $fuse->name,
            'type' => $fuse->type->label(),
            'rating' => $fuse->rating->value,
        ]);

        return $this->pdfRenderer->render($template->view(), [
            'board' => $board->name,
            'investor' => $site->investor_name,
            'siteName' => $site->name,
            'siteAddress' => collect([$site->address, $site->city])->filter()->implode(', '),
            'date' => now('Europe/Belgrade')->format('d.m.Y.'),
            'company' => [
                'name' => $company['name'],
                'contact' => collect([$company['phone'] ? "Tel: {$company['phone']}" : null, $company['email']])->filter()->implode(' · '),
            ],
            'logo' => PdfRenderer::imageDataUri(Setting::logoPath()),
            'count' => $fuses->count(),
            'pages' => $fuses->isEmpty() ? [[]] : $fuses->chunk($template->perPage())->map(fn ($page) => $page->values()->all())->all(),
        ], landscape: true);
    }
}
