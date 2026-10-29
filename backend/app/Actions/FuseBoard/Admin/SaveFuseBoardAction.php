<?php

namespace App\Actions\FuseBoard\Admin;

use App\Models\Fuse;
use App\Models\FuseBoard;
use App\Traits\Core\AsAction;
use Illuminate\Support\Facades\DB;

class SaveFuseBoardAction
{
    use AsAction;

    /**
     * Cuva naziv table i, ako su poslati, sve njene osigurace odjednom. Redni broj je mesto
     * u poslatom spisku, pa se posle premestanja ili brisanja brojevi sami poredjaju.
     *
     * @param array{name: string, fuses?: array<int, array{name: string, type: int, rating: int}>|null} $data
     */
    public function handle(FuseBoard $board, array $data): FuseBoard
    {
        return DB::transaction(function () use ($board, $data) {
            $board->fill(['name' => $data['name']])->save();

            if (array_key_exists('fuses', $data)) {
                Fuse::query()->where('fuse_board_id', $board->id)->delete();

                foreach (array_values($data['fuses'] ?? []) as $index => $fuse) {
                    $board->fuses()->create([...$fuse, 'position' => $index + 1]);
                }
            }

            return $board->load('fuses');
        });
    }
}
