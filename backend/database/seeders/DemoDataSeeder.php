<?php

namespace Database\Seeders;

use App\Actions\LaborEntry\Admin\SaveLaborEntryAction;
use App\Actions\Payment\Admin\SavePaymentAction;
use App\Actions\SiteItem\Admin\SaveSiteItemAction;
use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use App\Enums\ItemType;
use App\Enums\Role;
use App\Enums\SiteStatus;
use App\Models\ExchangeRate;
use App\Models\PriceListItem;
use App\Models\Site;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Probni podaci za lokalni pregled (php artisan db:seed --class=DemoDataSeeder).
 * Kursevi se upisuju direktno, da seeder ne zavisi od interneta.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $day = fn (int $daysAgo): string => now('Europe/Belgrade')->subDays($daysAgo)->toDateString();

        foreach (range(0, 40) as $daysAgo) {
            ExchangeRate::query()->firstOrCreate(
                ['currency' => Currency::EUR, 'effective_at' => Carbon::createFromFormat('!Y-m-d', $day($daysAgo))],
                ['rate' => '117.' . str_pad((string) (1500 + $daysAgo * 7), 4, '0', STR_PAD_LEFT), 'source' => ExchangeRateSource::API]
            );
        }

        User::query()->firstOrCreate(
            ['email' => 'radnik@sparkylink.rs'],
            // Ista lozinka kao prvi nalog (SECRET_PASSWORD), da nijedna lozinka ne stoji u kodu.
            ['name' => 'Petar Radnik', 'password' => config('app.secret_password'), 'role_id' => Role::WORKER]
        );

        $this->priceList();

        $items = app(SaveSiteItemAction::class);
        $labor = app(SaveLaborEntryAction::class);
        $payments = app(SavePaymentAction::class);

        // 1. Otvoreno gradiliste u evrima, delimicno placeno.
        $house = Site::query()->create([
            'status' => SiteStatus::OPEN,
            'currency' => Currency::EUR,
            'name' => 'Kuća Petrović – Zemun',
            'address' => 'Cara Dušana 120',
            'city' => 'Zemun',
            'investor_name' => 'Marko Petrović',
            'investor_phone' => '+381641112233',
            'investor_email' => 'marko.petrovic@example.com',
            'description' => 'Kompletna elektroinstalacija prizemlja i sprata.',
            'started_at' => $day(25),
        ]);

        foreach ([
            [ItemType::SERVICE, Currency::EUR, 'Ugradnja utičnice', 'kom', '25', '0', '8', 20],
            [ItemType::SERVICE, Currency::EUR, 'Razvod kabla', 'm', '120', '0', '2', 18],
            [ItemType::SERVICE, Currency::EUR, 'Montaža razvodne table', 'kom', '1', '0', '60', 10],
            [ItemType::MATERIAL, Currency::RSD, 'Kabl PP-Y 3x2,5', 'm', '120', '85', '105', 22],
            [ItemType::MATERIAL, Currency::RSD, 'Utičnica šuko bela', 'kom', '25', '450', '560', 21],
            [ItemType::MATERIAL, Currency::RSD, 'Razvodna tabla 36 modula', 'kom', '1', '9800', '12000', 12],
            [ItemType::MATERIAL, Currency::RSD, 'Automatski osigurač B16', 'kom', '12', '420', '520', 12],
            [ItemType::OTHER, Currency::RSD, 'Gorivo', 'paušal', '1', '3000', '0', 15],
        ] as [$type, $currency, $name, $unit, $quantity, $purchase, $sale, $daysAgo]) {
            $items->handle($house, [
                'type' => $type->value, 'currency' => $currency->value, 'name' => $name, 'unit' => $unit,
                'quantity' => $quantity, 'purchase_price' => $purchase, 'sale_price' => $sale,
                'occurred_at' => $day($daysAgo), 'exchange_rate' => $this->rate($day($daysAgo)),
            ]);
        }

        foreach ([20, 19, 18, 12] as $daysAgo) {
            $labor->handle($house, [
                'currency' => Currency::RSD->value, 'workers_count' => 2, 'hours' => '8', 'hourly_rate' => '500',
                'worked_at' => $day($daysAgo), 'exchange_rate' => $this->rate($day($daysAgo)), 'description' => 'Petar i Nikola',
            ]);
        }

        $payments->handle($house, [
            'currency' => Currency::EUR->value, 'amount' => '500', 'paid_at' => $day(24),
            'exchange_rate' => $this->rate($day(24)), 'note' => 'Avans za materijal',
        ]);

        $house->notes()->create(['body' => 'Investitor traži još 3 utičnice u dnevnoj sobi i jednu na terasi.']);
        $house->notes()->create(['body' => 'Razvod u kupatilu snimljen pre malterisanja – slike u galeriji.']);

        // 2. Zatvoreno gradiliste u dinarima, placeno u celosti.
        $shop = Site::query()->create([
            'status' => SiteStatus::CLOSED,
            'currency' => Currency::RSD,
            'name' => 'Lokal Centar – Novi Sad',
            'address' => 'Zmaj Jovina 8',
            'city' => 'Novi Sad',
            'investor_name' => 'Kafeterija Centar DOO',
            'investor_phone' => '+38121555444',
            'started_at' => $day(40),
            'completed_at' => $day(30),
        ]);

        $items->handle($shop, [
            'type' => ItemType::SERVICE->value, 'currency' => Currency::RSD->value, 'name' => 'Rasveta – montaža svetiljki',
            'unit' => 'kom', 'quantity' => '18', 'sale_price' => '1500', 'occurred_at' => $day(32), 'exchange_rate' => $this->rate($day(32)),
        ]);
        $items->handle($shop, [
            'type' => ItemType::MATERIAL->value, 'currency' => Currency::RSD->value, 'name' => 'LED panel 60x60',
            'unit' => 'kom', 'quantity' => '18', 'purchase_price' => '2900', 'sale_price' => '3500',
            'occurred_at' => $day(33), 'exchange_rate' => $this->rate($day(33)),
        ]);
        $labor->handle($shop, [
            'currency' => Currency::RSD->value, 'workers_count' => 2, 'hours' => '7', 'hourly_rate' => '550',
            'worked_at' => $day(32), 'exchange_rate' => $this->rate($day(32)),
        ]);
        $payments->handle($shop, [
            'currency' => Currency::RSD->value, 'amount' => '90000', 'paid_at' => $day(29),
            'exchange_rate' => $this->rate($day(29)), 'note' => 'Uplata na račun',
        ]);

        // 3. Ponuda koja ceka odgovor investitora.
        $offer = Site::query()->create([
            'status' => SiteStatus::OFFER,
            'currency' => Currency::EUR,
            'name' => 'Stan Vračar – rekonstrukcija',
            'address' => 'Njegoševa 45',
            'city' => 'Beograd',
            'investor_name' => 'Jelena Jovanović',
            'investor_phone' => '+381631234567',
        ]);

        foreach ([
            [ItemType::SERVICE, 'Demontaža stare instalacije', 'paušal', '1', '150'],
            [ItemType::SERVICE, 'Nova instalacija – po tački', 'kom', '42', '15'],
            [ItemType::MATERIAL, 'Materijal za instalaciju (procena)', 'paušal', '1', '900'],
        ] as [$type, $name, $unit, $quantity, $sale]) {
            $items->handle($offer, [
                'type' => $type->value, 'currency' => Currency::EUR->value, 'name' => $name, 'unit' => $unit,
                'quantity' => $quantity, 'purchase_price' => '0', 'sale_price' => $sale,
                'occurred_at' => $day(1), 'exchange_rate' => $this->rate($day(1)),
            ]);
        }
    }

    private function rate(string $day): string
    {
        return (string) ExchangeRate::query()
                                    ->where('currency', Currency::EUR)
                                    ->where('effective_at', Carbon::createFromFormat('!Y-m-d', $day))
                                    ->value('rate');
    }

    private function priceList(): void
    {
        foreach ([
            [ItemType::SERVICE, Currency::EUR, 'Ugradnja utičnice', 'kom', null, '8'],
            [ItemType::SERVICE, Currency::EUR, 'Ugradnja prekidača', 'kom', null, '8'],
            [ItemType::SERVICE, Currency::EUR, 'Razvod kabla', 'm', null, '2'],
            [ItemType::SERVICE, Currency::EUR, 'Montaža razvodne table', 'kom', null, '60'],
            [ItemType::SERVICE, Currency::EUR, 'Montaža svetiljke', 'kom', null, '12'],
            [ItemType::MATERIAL, Currency::RSD, 'Kabl PP-Y 3x1,5', 'm', '62', '78'],
            [ItemType::MATERIAL, Currency::RSD, 'Kabl PP-Y 3x2,5', 'm', '85', '105'],
            [ItemType::MATERIAL, Currency::RSD, 'Automatski osigurač B16', 'kom', '420', '520'],
        ] as [$type, $currency, $name, $unit, $purchase, $sale]) {
            PriceListItem::query()->firstOrCreate(
                ['name' => $name],
                ['type' => $type, 'currency' => $currency, 'unit' => $unit, 'purchase_price' => $purchase, 'sale_price' => $sale]
            );
        }
    }
}
