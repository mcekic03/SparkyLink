<?php

namespace App\Http\Controllers;

use App\Actions\FuseBoard\Shared\RenderFuseBoardPdfAction;
use App\Actions\Receipt\Shared\RenderReceiptCopyPdfAction;
use App\Enums\FuseBoardTemplate;
use App\Models\Document;
use App\Models\FuseBoard;
use App\Models\Receipt;
use App\Models\Setting;
use App\Models\SiteMedia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Privatni fajlovi preko relativnih potpisanih linkova (middleware `signed:relative`), da bi
 * <img>, <video> i PDF u novom prozoru radili bez tokena. Video podrzava Range (premotavanje).
 */
class FileController extends Controller
{
    public function media(SiteMedia $media, ?string $variant = null): BinaryFileResponse
    {
        $path = $variant === 'thumb' ? $media->thumbnail_path : $media->path;

        abort_unless($path && Storage::disk($media->disk)->exists($path), 404);

        $mime = $variant === 'thumb' ? 'image/jpeg' : $media->mime_type;

        return $this->inline(Storage::disk($media->disk)->path($path), $mime, $media->original_name);
    }

    public function receiptPhoto(Receipt $receipt): BinaryFileResponse
    {
        abort_unless($receipt->photo_path && Storage::disk('local')->exists($receipt->photo_path), 404);

        $path = Storage::disk('local')->path($receipt->photo_path);

        return $this->inline($path, mime_content_type($path) ?: 'image/jpeg', basename($path));
    }

    public function receiptCopy(Receipt $receipt): Response
    {
        $pdf = RenderReceiptCopyPdfAction::make()->handle($receipt);
        $name = 'kopija-racuna-' . Str::slug($receipt->receipt_number ?: (string) $receipt->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$name}\"",
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function document(Document $document): BinaryFileResponse
    {
        abort_unless($document->pdf_path && Storage::disk('local')->exists($document->pdf_path), 404);

        $name = Str::slug($document->type->label() . '-' . $document->number) . '.pdf';

        return $this->inline(Storage::disk('local')->path($document->pdf_path), 'application/pdf', $name);
    }

    /**
     * Raspored osiguraca se ne cuva: PDF se pravi pri svakom otvaranju, u izabranom izgledu.
     */
    public function fuseBoard(FuseBoard $fuseBoard, int $template): Response
    {
        $pdf = RenderFuseBoardPdfAction::make()->handle($fuseBoard, FuseBoardTemplate::from($template));
        $name = 'raspored-osiguraca-' . (Str::slug($fuseBoard->name) ?: $fuseBoard->id) . '.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$name}\"",
            'Cache-Control' => 'private, no-store',
        ]);
    }

    /**
     * Logo firme je javan (prikazuje se i na stranici za prijavu).
     */
    public function logo(): BinaryFileResponse
    {
        $path = Setting::logoPath();

        return response()->file($path, [
            'Content-Type' => mime_content_type($path) ?: 'image/png',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    private function inline(string $path, string $mime, string $name): BinaryFileResponse
    {
        $response = response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'private, max-age=3600',
        ]);

        $response->setContentDisposition('inline', Str::ascii($name) ?: 'fajl');

        return $response;
    }
}
