<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ResetSuperAdminPasswordCommand extends Command
{
    protected $signature = 'admin:reset-super-admin-password {password? : Nova lozinka (ako se izostavi, generise se)}';

    protected $description = 'Postavlja novu lozinku prvom super-admin nalogu (vlasniku)';

    public function handle(): int
    {
        /** @var User|null $superAdmin */
        $superAdmin = User::query()->where('role_id', Role::SUPER_ADMIN)->orderBy('id')->first();

        if (! $superAdmin) {
            $this->components->error('Super-admin nalog ne postoji.');

            return self::FAILURE;
        }

        $password = $this->argument('password') ?: Str::random(14);

        $superAdmin->patch(['password' => $password]);
        $superAdmin->tokens()->delete();

        $this->components->info("Lozinka za {$superAdmin->email} je postavljena na: {$password}");

        return self::SUCCESS;
    }
}
