<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature testovi koriste MySQL test bazu (sparkylink_test) uz RefreshDatabase,
| pa migracije (uloge, podesavanja, prvi nalog) prolaze pre svakog testa.
| Spoljni servisi (kurs, Poreska uprava, Gotenberg) su uvek lazirani.
|
*/

use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

/**
 * Jedini nalog u sistemu (vlasnik), pravi ga migracija.
 */
function superAdmin(): User
{
    return User::query()->where('email', config('app.admin_email'))->firstOrFail();
}

/**
 * Kurs evra za dan, upisan unapred (da testovi ne zovu servis).
 */
function rateFor(string $day, string $rate = '117.0000'): ExchangeRate
{
    return ExchangeRate::query()->create([
        'currency' => Currency::EUR,
        'source' => ExchangeRateSource::API,
        'rate' => $rate,
        'effective_at' => Carbon::createFromFormat('!Y-m-d', $day),
    ]);
}

function belgradeToday(): string
{
    return now('Europe/Belgrade')->toDateString();
}

/**
 * Excel kakav salje prodavnica: zaglavlje radnje, tabela od 19. reda sa formulom za ukupno
 * po redu, zbirni red "UKUPNO:" i napomene ispod; na drugom listu je nesto sto se ne uvozi.
 *
 * @param array<int, array{0: string, 1: string, 2: int|float, 3: int|float}> $rows
 */
function storeSpreadsheetFile(array $rows, string $format = 'Xls', string $name = 'ponuda.xls'): UploadedFile
{
    $book = new Spreadsheet();
    $sheet = $book->getActiveSheet()->setTitle('Sheet1');
    $sheet->setCellValue('D2', 'Radnja za trgovinsku delatnost i postavljanje elektricnih instalacija');
    $sheet->setCellValue('F9', 'Naziv:');
    $sheet->setCellValue('G9', 'Kupac Probni');
    $sheet->setCellValue('B10', 'Datum prometa dobara:');
    $sheet->setCellValue('C10', 'Nis 29.06.2026.');
    $sheet->fromArray(['Red.br.', 'Vrsta dobra-usluge', 'Jed. Mere', 'Kolicina', 'Cena', 'Stopa PDV', 'Osnovica PDV', 'Obračunat PDV', 'Ukupna naknada'], null, 'A19');

    $row = 20;
    foreach ($rows as $index => [$item, $unit, $quantity, $price]) {
        $sheet->fromArray([($index + 1) . '.', $item, $unit, $quantity, $price, 0.2], null, "A{$row}");
        $sheet->setCellValue("I{$row}", "=SUM(D{$row}*E{$row})");
        $row++;
    }

    $sheet->setCellValue("A{$row}", 'UKUPNO:');
    $sheet->setCellValue("I{$row}", '=SUM(I20:I' . ($row - 1) . ')');
    $sheet->setCellValue('B' . ($row + 2), 'Napomena o poreskom oslobodjenju:');
    $sheet->setCellValue('B' . ($row + 6), 'Robu primio:____________________Br.lk._____________');
    $book->createSheet()->setTitle('Sheet2')->fromArray([['Naziv', 'Kolicina', 'Cena'], ['Ne sme da se uveze', 5, 100]]);

    $path = tempnam(sys_get_temp_dir(), 'excel');
    IOFactory::createWriter($book, $format)->save($path);

    return new UploadedFile($path, $name, null, null, true);
}
