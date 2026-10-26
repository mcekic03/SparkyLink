<?php

use App\Enums\MediaType;
use App\Models\Site;
use App\Models\SiteMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Storage::fake('local');
    $this->site = Site::factory()->create();
});

test('a worker uploads a photo, gets a thumbnail and private signed links', function () {
    Sanctum::actingAs(worker());

    $media = $this->post("/api/admin/sites/{$this->site->id}/media", [
        'file' => UploadedFile::fake()->image('kablovi.jpg', 1600, 1200),
        'caption' => 'Razvod u kupatilu pre malterisanja',
    ], ['Accept' => 'application/json'])->assertOk()->json('data');

    expect($media['type'])->toBe(MediaType::IMAGE->value)
        ->and($media['width'])->toBe(1600)
        ->and($media['thumbnail_url'])->not->toBeNull();

    $this->get($media['url'])->assertOk();
    $this->get($media['thumbnail_url'])->assertOk()->assertHeader('Content-Type', 'image/jpeg');
    $this->get("/api/files/media/{$media['id']}")->assertForbidden();
});

test('a video is stored as is, with the thumbnail sent by the browser', function () {
    Sanctum::actingAs(plainAdmin());

    $media = $this->post("/api/admin/sites/{$this->site->id}/media", [
        'file' => UploadedFile::fake()->create('trasa.mp4', 2048, 'video/mp4'),
        'thumbnail' => UploadedFile::fake()->image('poster.jpg', 640, 360),
    ], ['Accept' => 'application/json'])->assertOk()->json('data');

    expect($media['type'])->toBe(MediaType::VIDEO->value)
        ->and($media['thumbnail_url'])->not->toBeNull();
});

test('a file that is neither image nor video is refused', function () {
    Sanctum::actingAs(plainAdmin());

    $this->post("/api/admin/sites/{$this->site->id}/media", [
        'file' => UploadedFile::fake()->create('virus.exe', 10, 'application/octet-stream'),
    ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('file');
});

test('a worker cannot delete somebody else\'s photo; deleting removes the files', function () {
    Sanctum::actingAs(plainAdmin());
    $id = $this->post("/api/admin/sites/{$this->site->id}/media", [
        'file' => UploadedFile::fake()->image('a.jpg', 800, 600),
    ], ['Accept' => 'application/json'])->assertOk()->json('data.id');
    $media = SiteMedia::query()->findOrFail($id);

    Sanctum::actingAs(worker());
    $this->deleteJson("/api/admin/media/{$id}")->assertNotFound();

    Sanctum::actingAs(plainAdmin());
    $this->deleteJson("/api/admin/media/{$id}")->assertOk();
    Storage::disk('local')->assertMissing($media->path);
});

test('notes are added by anyone on the site and edited only by their author or an admin', function () {
    $author = worker();
    Sanctum::actingAs($author);
    $note = $this->postJson("/api/admin/sites/{$this->site->id}/notes", ['body' => 'Investitor traži još 3 utičnice u dnevnoj sobi.'])
                 ->assertOk()->json('data');

    expect($note['can_edit'])->toBeTrue();

    Sanctum::actingAs(worker());
    $this->putJson("/api/admin/notes/{$note['id']}", ['body' => 'promena'])->assertNotFound();

    Sanctum::actingAs(plainAdmin());
    $this->putJson("/api/admin/notes/{$note['id']}", ['body' => 'Dogovoreno: 3 utičnice.'])->assertOk();
    expect($this->getJson("/api/admin/sites/{$this->site->id}/notes")->json('data.0.body'))->toBe('Dogovoreno: 3 utičnice.');
});
