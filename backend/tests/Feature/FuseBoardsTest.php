<?php

use App\Enums\FuseType;
use App\Models\Fuse;
use App\Models\FuseBoard;
use App\Models\Site;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Http::fake(['gotenberg.test/*' => Http::response('%PDF-1.7 lazni', 200)]);
    Sanctum::actingAs(superAdmin());

    $this->site = Site::factory()->create([
        'name' => 'Kuća Petrović',
        'address' => 'Nemanjina 14',
        'city' => 'Leskovac',
        'investor_name' => 'Petar Petrović',
    ]);
});

/**
 * @param array<int, array{0: string, 1: FuseType, 2: int}> $fuses
 */
function storeFuseBoard(Site $site, string $name, array $fuses): TestResponse
{
    return test()->postJson("/api/admin/sites/{$site->id}/fuse-boards", [
        'name' => $name,
        'fuses' => array_map(fn (array $fuse) => ['name' => $fuse[0], 'type' => $fuse[1]->value, 'rating' => $fuse[2]], $fuses),
    ]);
}

/**
 * Delovi multipart zahteva koje je PdfRenderer poslao Gotenbergu (HTML je u delu `files`).
 *
 * @return array<int, array<string, string>>
 */
function sentPdfRequests(): array
{
    return Http::recorded()
               ->map(fn (array $pair) => collect($pair[0]->data())->pluck('contents', 'name')->all())
               ->all();
}

test('a board keeps its fuses numbered in the order they were entered', function () {
    $board = storeFuseBoard($this->site, 'Razvodni ormar – prizemlje', [
        ['Rasveta – dnevna soba', FuseType::B, 10],
        ['Bojler', FuseType::B, 20],
        ['Klima', FuseType::C, 16],
    ])->assertOk()->json('data');

    $listed = $this->getJson("/api/admin/sites/{$this->site->id}/fuse-boards")->assertOk()->json('data');

    expect($listed)->toHaveCount(1)
        ->and($listed[0]['id'])->toBe($board['id'])
        ->and($listed[0]['name'])->toBe('Razvodni ormar – prizemlje')
        ->and($listed[0]['fuses'])->toBe([
            ['number' => 1, 'name' => 'Rasveta – dnevna soba', 'type' => 1, 'rating' => 10],
            ['number' => 2, 'name' => 'Bojler', 'type' => 1, 'rating' => 20],
            ['number' => 3, 'name' => 'Klima', 'type' => 2, 'rating' => 16],
        ]);
});

test('a site has a separate board for every cabinet, listed in the order they were added', function () {
    storeFuseBoard($this->site, 'Glavna tabla', [['Podtabla', FuseType::C, 32]])->assertOk();
    storeFuseBoard($this->site, 'Podtabla – sprat', [])->assertOk();
    storeFuseBoard(Site::factory()->create(), 'Tuđa tabla', [])->assertOk();

    $boards = $this->getJson("/api/admin/sites/{$this->site->id}/fuse-boards")->assertOk()->json('data');

    expect(array_column($boards, 'name'))->toBe(['Glavna tabla', 'Podtabla – sprat'])
        ->and($boards[0]['fuses'])->toHaveCount(1)
        ->and($boards[1]['fuses'])->toBe([]);
});

test('saving a board replaces its fuses and numbers them again', function () {
    $id = storeFuseBoard($this->site, 'Podtabla', [
        ['Rasveta', FuseType::B, 10],
        ['Bojler', FuseType::B, 20],
        ['Klima', FuseType::C, 16],
    ])->json('data.id');

    $this->putJson("/api/admin/fuse-boards/{$id}", [
        'name' => 'Podtabla – sprat',
        'fuses' => [
            ['name' => 'Klima', 'type' => FuseType::C->value, 'rating' => 16],
            ['name' => 'Rasveta', 'type' => FuseType::B->value, 'rating' => 6],
        ],
    ])->assertOk();

    $board = $this->getJson("/api/admin/sites/{$this->site->id}/fuse-boards")->json('data.0');

    expect($board['name'])->toBe('Podtabla – sprat')
        ->and($board['fuses'])->toBe([
            ['number' => 1, 'name' => 'Klima', 'type' => 2, 'rating' => 16],
            ['number' => 2, 'name' => 'Rasveta', 'type' => 1, 'rating' => 6],
        ])
        ->and(Fuse::query()->count())->toBe(2);
});

test('renaming a board without sending fuses keeps them', function () {
    $id = storeFuseBoard($this->site, 'Podtabla', [['Rasveta', FuseType::B, 10], ['Bojler', FuseType::B, 20]])->json('data.id');

    $this->putJson("/api/admin/fuse-boards/{$id}", ['name' => 'Podtabla – garaža'])->assertOk();

    $board = $this->getJson("/api/admin/sites/{$this->site->id}/fuse-boards")->json('data.0');

    expect($board['name'])->toBe('Podtabla – garaža')
        ->and(array_column($board['fuses'], 'name'))->toBe(['Rasveta', 'Bojler']);
});

test('a fuse needs a name, a listed rating and type B or C', function () {
    $this->postJson("/api/admin/sites/{$this->site->id}/fuse-boards", [
        'name' => '',
        'fuses' => [
            ['name' => 'Rasveta', 'type' => FuseType::B->value, 'rating' => 15],
            ['name' => 'Bojler', 'type' => 3, 'rating' => 16],
            ['name' => '', 'type' => FuseType::C->value, 'rating' => 32],
        ],
    ])->assertUnprocessable()
         ->assertJsonValidationErrors(['name', 'fuses.0.rating', 'fuses.1.type', 'fuses.2.name'])
         ->assertJsonMissingValidationErrors(['fuses.0.type', 'fuses.1.rating', 'fuses.2.rating']);

    expect(FuseBoard::query()->count())->toBe(0);
});

test('deleting a board removes its fuses', function () {
    $id = storeFuseBoard($this->site, 'Podtabla', [['Rasveta', FuseType::B, 10], ['Bojler', FuseType::B, 20]])->json('data.id');
    $kept = storeFuseBoard($this->site, 'Glavna tabla', [['Podtabla', FuseType::C, 32]])->json('data.id');

    $this->deleteJson("/api/admin/fuse-boards/{$id}")->assertOk();

    expect(FuseBoard::query()->pluck('id')->all())->toBe([$kept])
        ->and(Fuse::query()->pluck('name')->all())->toBe(['Podtabla']);
});

test('every template is a landscape pdf with the cabinet, the investor, the date and the fuses', function () {
    $board = storeFuseBoard($this->site, 'Razvodni ormar – prizemlje', [
        ['Šporet', FuseType::B, 25],
        ['Pumpa za vodu', FuseType::C, 10],
    ])->json('data');

    expect(array_column($board['pdf_urls'], 'template'))->toBe([1, 2, 3, 4]);

    foreach ($board['pdf_urls'] as $pdf) {
        $this->get($pdf['url'])->assertOk()->assertHeader('Content-Type', 'application/pdf');
    }

    $sent = sentPdfRequests();
    $today = now('Europe/Belgrade')->format('d.m.Y.');

    expect($sent)->toHaveCount(4)
        ->and(array_unique(array_column($sent, 'files')))->toHaveCount(4);

    foreach ($sent as $parts) {
        expect($parts['paperWidth'])->toBe('11.69')
            ->and($parts['paperHeight'])->toBe('8.27')
            ->and($parts['files'])->toContain('Razvodni ormar – prizemlje', 'Petar Petrović', 'Kuća Petrović', 'Nemanjina 14', $today, 'Šporet', 'Pumpa za vodu')
            ->and($parts['files'])->toMatch('/B\s*25/')
            ->and($parts['files'])->toMatch('/C\s*10/');
    }
});

test('a long board continues on the next page without losing a fuse', function () {
    $fuses = array_map(fn (int $n) => [sprintf('Strujni krug %02d', $n), FuseType::B, 16], range(1, 40));
    $board = storeFuseBoard($this->site, 'Glavna tabla', $fuses)->json('data');

    foreach ($board['pdf_urls'] as $pdf) {
        $this->get($pdf['url'])->assertOk();
    }

    foreach (sentPdfRequests() as $parts) {
        foreach (range(1, 40) as $n) {
            expect($parts['files'])->toContain(sprintf('Strujni krug %02d', $n));
        }
    }
});

test('the pdf link must be signed and name one of the four templates', function () {
    $board = storeFuseBoard($this->site, 'Podtabla', [['Rasveta', FuseType::B, 10]])->json('data');

    $this->get("/api/files/fuse-boards/{$board['id']}/1")->assertForbidden();
    $this->get(signed_file_url('api.files.fuse-boards', ['fuseBoard' => $board['id'], 'template' => 5]))->assertNotFound();

    Http::assertNothingSent();
});
