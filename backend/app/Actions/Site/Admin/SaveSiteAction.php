<?php

namespace App\Actions\Site\Admin;

use App\Enums\SiteStatus;
use App\Models\Site;
use App\Traits\Core\AsAction;

class SaveSiteAction
{
    use AsAction;

    /**
     * Cuva gradiliste. Otvoreno bez datuma pocetka dobija danasnji, zatvoreno bez datuma
     * zavrsetka takodje.
     *
     * @param array<string, mixed> $data validirani podaci (SiteRequest)
     */
    public function handle(array $data, ?Site $site = null): Site
    {
        $status = SiteStatus::from((int) $data['status']);
        $today = now('Europe/Belgrade')->toDateString();

        if ($status === SiteStatus::OPEN && empty($data['started_at']) && ! $site?->started_at) {
            $data['started_at'] = $today;
        }

        if ($status === SiteStatus::CLOSED && empty($data['completed_at']) && ! $site?->completed_at) {
            $data['completed_at'] = $today;
        }

        if ($site) {
            $site->update($data);

            return $site;
        }

        return Site::query()->create([...$data, 'created_by' => auth()->id()]);
    }
}
