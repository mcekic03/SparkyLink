<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Kolone koje pamte ko je nesto uneo.
     */
    private const AUTHOR_COLUMNS = [
        ['sites', 'created_by'],
        ['receipts', 'created_by'],
        ['site_items', 'created_by'],
        ['labor_entries', 'created_by'],
        ['payments', 'created_by'],
        ['documents', 'created_by'],
        ['item_imports', 'created_by'],
        ['site_notes', 'user_id'],
        ['site_media', 'user_id'],
    ];

    /**
     * Sistem ima jedan nalog, vlasnika. Ostali nalozi i uloge administrator i radnik se brisu,
     * a ono sto su ti nalozi uneli prelazi na vlasnika.
     */
    public function up(): void
    {
        $owner = DB::table('users')->where('email', config('app.admin_email'))->value('id')
            ?? DB::table('users')->where('role_id', Role::SUPER_ADMIN->value)->orderBy('id')->value('id');

        if ($owner === null) {
            return;
        }

        DB::transaction(function () use ($owner) {
            $others = DB::table('users')->where('id', '!=', $owner)->pluck('id');

            if ($others->isNotEmpty()) {
                foreach (self::AUTHOR_COLUMNS as [$table, $column]) {
                    DB::table($table)->whereIn($column, $others)->update([$column => $owner]);
                }

                DB::table('personal_access_tokens')
                  ->where('tokenable_type', User::class)
                  ->whereIn('tokenable_id', $others)
                  ->delete();
                DB::table('users')->whereIn('id', $others)->delete();
            }

            DB::table('users')->where('id', $owner)->update(['role_id' => Role::SUPER_ADMIN->value]);
            DB::table('roles')->where('id', '!=', Role::SUPER_ADMIN->value)->delete();
        });
    }

    public function down(): void
    {
        // Obrisani nalozi se ne vracaju.
    }
};
