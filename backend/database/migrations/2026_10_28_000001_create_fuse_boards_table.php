<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Tabla (ormar) na gradilistu sa rasporedom osiguraca; PDF se pravi na zahtev i ne cuva se.
        Schema::create('fuse_boards', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');

            $table->string('name');

            $table->timestamps();
        });

        Schema::create('fuses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('fuse_board_id')->constrained('fuse_boards');

            $table->tinyInteger('type');
            $table->tinyInteger('rating');

            // Redni broj na tabli (1, 2, 3...).
            $table->unsignedSmallInteger('position');
            $table->string('name');

            $table->timestamps();

            $table->index(['fuse_board_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuses');
        Schema::dropIfExists('fuse_boards');
    }
};
