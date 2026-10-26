<?php

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Jedini nalog koji se pravi sam: vlasnik (super administrator). Mejl i lozinka dolaze iz
     * stack-a (ADMIN_EMAIL, SECRET_PASSWORD); lozinka se menja posle prve prijave u profilu.
     */
    public function up(): void
    {
        // Bez lozinke nalog ne bi mogao bezbedno da se napravi, pa start staje sa jasnom porukom.
        if (blank(config('app.secret_password'))) {
            throw new RuntimeException('SECRET_PASSWORD nije postavljen: to je lozinka prvog naloga, zadaje se u okruzenju (.env).');
        }

        /** @var User $user */
        $user = User::query()->createOrFirst(
            ['email' => config('app.admin_email')],
            [
                'name' => 'Administrator',
                'password' => config('app.secret_password'),
                'role_id' => Role::SUPER_ADMIN,
            ]
        );

        $user->markEmailAsVerified();
    }
};
