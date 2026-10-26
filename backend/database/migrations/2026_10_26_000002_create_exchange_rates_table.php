<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->id();

            $table->tinyInteger('currency');
            $table->tinyInteger('source')->default(1);

            // Dinara za 1 jedinicu valute (srednji kurs NBS).
            $table->decimal('rate', 12, 4);

            $table->dateTime('effective_at');

            $table->timestamps();

            $table->unique(['currency', 'effective_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
    }
};
