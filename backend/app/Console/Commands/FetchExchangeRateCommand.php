<?php

namespace App\Console\Commands;

use App\Actions\ExchangeRate\Shared\FetchExchangeRateAction;
use Illuminate\Console\Command;

class FetchExchangeRateCommand extends Command
{
    protected $signature = 'exchange-rates:fetch {--date= : Dan (YYYY-MM-DD), podrazumevano danas}';

    protected $description = 'Preuzima srednji kurs NBS za evro i cuva ga';

    public function handle(FetchExchangeRateAction $fetchExchangeRateAction): int
    {
        $day = (string) ($this->option('date') ?: now('Europe/Belgrade')->toDateString());

        $rate = $fetchExchangeRateAction->handle($day);

        if (! $rate) {
            $this->error("Kurs za {$day} nije preuzet.");

            return self::FAILURE;
        }

        $this->info("Kurs za {$day}: 1 EUR = {$rate->rate} RSD");

        return self::SUCCESS;
    }
}
