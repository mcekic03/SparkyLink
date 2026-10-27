<?php

namespace App\Actions\SiteItem\Admin;

use App\Classes\Utilities\ImportedItemsMatcher;
use App\Models\ItemImport;
use App\Models\Site;
use App\Traits\Core\AsAction;

class MatchSpreadsheetFilesAction
{
    use AsAction;

    // Fajl se predlaze kao nova verzija ranijeg uvoza kad se bar pola njegovih stavki poklopi po nazivu.
    private const SUGGEST_SHARE = 0.5;

    /**
     * Za svaki procitani fajl: raniji uvozi ovog gradilista sa kojima ima zajednickih stavki (sta je
     * isto, izmenjeno i novo) i predlog uvoza cija je ovo nova verzija. Nista se ne menja.
     *
     * @param array<int, array{name: string, items: array<int, array<string, string>>, error: string|null}> $files
     *
     * @return array<int, array<string, mixed>>
     */
    public function handle(Site $site, array $files): array
    {
        $imports = ItemImport::query()
                             ->where('site_id', $site->id)
                             ->with(['items' => fn ($query) => $query->orderBy('id')])
                             ->orderByDesc('created_at')
                             ->orderByDesc('id')
                             ->get();

        return array_map(function (array $file) use ($imports) {
            $rows = array_map(fn (array $item) => [
                'name' => $item['name'],
                'unit' => $item['unit'],
                'quantity' => $item['quantity'],
                'price' => $item['unit_price'],
            ], $file['items']);

            $candidates = [];

            foreach ($imports as $import) {
                $match = ImportedItemsMatcher::match($import->items, $rows);
                $statuses = array_column($match['rows'], 'status');
                $counts = array_count_values($statuses) + [ImportedItemsMatcher::SAME => 0, ImportedItemsMatcher::CHANGED => 0, ImportedItemsMatcher::NEW => 0];

                if ($counts[ImportedItemsMatcher::SAME] + $counts[ImportedItemsMatcher::CHANGED] === 0) {
                    continue;
                }

                $candidates[] = [
                    'import_id' => $import->id,
                    'file_name' => $import->file_name,
                    'created_at' => $import->created_at,
                    'same' => $counts[ImportedItemsMatcher::SAME],
                    'changed' => $counts[ImportedItemsMatcher::CHANGED],
                    'new' => $counts[ImportedItemsMatcher::NEW],
                    'missing' => $match['missing'],
                    'rows' => array_map(fn (array $row) => [
                        'status' => $row['status'],
                        'item_id' => $row['item']?->id,
                        'previous' => $row['status'] === ImportedItemsMatcher::CHANGED ? [
                            'quantity' => $row['item']->quantity,
                            'unit' => $row['item']->unit,
                            'sale_price' => $row['item']->sale_price,
                        ] : null,
                    ], $match['rows']),
                ];
            }

            usort($candidates, fn (array $a, array $b) => ($b['same'] + $b['changed']) <=> ($a['same'] + $a['changed']));

            $best = $candidates[0] ?? null;
            $suggested = $best !== null && $rows !== [] && ($best['same'] + $best['changed']) / count($rows) >= self::SUGGEST_SHARE
                ? $best['import_id']
                : null;

            return [...$file, 'candidates' => $candidates, 'suggested_import_id' => $suggested];
        }, $files);
    }
}
