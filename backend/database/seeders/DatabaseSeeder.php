<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Uloge, podesavanja i prvi nalog se upisuju u migracijama (obavezni podaci).
     * Ovde su samo probni podaci za lokalni pregled - u produkciji se ne pokrecu.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        activity()->disableLogging();

        $this->call(DemoDataSeeder::class);
    }
}
