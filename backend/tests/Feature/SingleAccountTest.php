<?php

use App\Enums\Role;
use App\Models\Site;
use App\Models\SiteNote;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Nalog iz vremena kad su postojale uloge administrator (2) i radnik (3).
 */
function formerAccount(int $roleId, string $email): int
{
    DB::table('roles')->insertOrIgnore([
        ['id' => 2, 'name' => 'Admin', 'slug' => 'admin', 'created_at' => now(), 'updated_at' => now()],
        ['id' => 3, 'name' => 'Worker', 'slug' => 'worker', 'created_at' => now(), 'updated_at' => now()],
    ]);

    $id = DB::table('users')->insertGetId([
        'role_id' => $roleId,
        'name' => 'Stari nalog',
        'email' => $email,
        'password' => Hash::make('Lozinka!123'),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('personal_access_tokens')->insert([
        'tokenable_type' => User::class,
        'tokenable_id' => $id,
        'name' => 'telefon',
        'token' => hash('sha256', $email),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $id;
}

test('only the owner account remains and what the other accounts entered moves to the owner', function () {
    $admin = formerAccount(2, 'admin@sparkylink.rs');
    $worker = formerAccount(3, 'radnik@sparkylink.rs');
    $site = Site::factory()->create(['created_by' => $admin]);
    $note = SiteNote::query()->create(['site_id' => $site->id, 'user_id' => $worker, 'body' => 'Dogovoreno: 3 utičnice.']);
    $ownerToken = superAdmin()->createToken('racunar');

    (require database_path('migrations/2026_10_28_000002_keep_only_owner_account.php'))->up();

    $owner = superAdmin();

    expect(User::query()->pluck('email')->all())->toBe([config('app.admin_email')])
        ->and($site->fresh()->created_by)->toBe($owner->id)
        ->and($note->fresh()->user_id)->toBe($owner->id)
        ->and(DB::table('roles')->pluck('id')->all())->toBe([Role::SUPER_ADMIN->value])
        ->and(DB::table('personal_access_tokens')->pluck('id')->all())->toBe([$ownerToken->accessToken->id]);
});

test('the only account reaches everything, including settings and the price list', function () {
    rateFor(belgradeToday());
    $token =$this->postJson('/api/admin/login', ['email' => config('app.admin_email'), 'password' => config('app.secret_password')])
                  ->assertOk()->json('token');

    $this->withToken($token)->getJson('/api/admin/dashboard')->assertOk();
    $this->withToken($token)->getJson('/api/admin/price-list-items')->assertOk();
    $this->withToken($token)->putJson('/api/admin/settings', [
        'company_name' => 'Cekić Elektrik',
        'company_phone' => '+381 64 111 2233',
        'default_currency' => 2,
        'default_markup_percent' => '20',
    ])->assertOk()->assertJsonPath('data.company_phone', '+381 64 111 2233');
});
