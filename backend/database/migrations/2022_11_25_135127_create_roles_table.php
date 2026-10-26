<?php

use App\Enums\Role as RoleEnum;
use App\Models\Role;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 30);
            $table->string('slug', 50);
            $table->timestamps();
        });

        Role::query()->insert(
            collect(RoleEnum::cases())
                ->map(fn (RoleEnum $role) => [
                    'name' => str($role->slug())->replace('-', ' ')->ucfirst(),
                    'slug' => $role->slug(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all()
        );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
