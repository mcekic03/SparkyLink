<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('labor_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->tinyInteger('currency')->default(1);

            // Trosak = broj radnika x sati x cena sata.
            $table->unsignedSmallInteger('workers_count');
            $table->decimal('hours', 6, 2);
            $table->decimal('hourly_rate', 12, 2);
            $table->decimal('exchange_rate', 12, 4);
            $table->decimal('total_rsd', 14, 2)->default(0);
            $table->decimal('total_eur', 14, 2)->default(0);
            $table->string('description')->nullable();

            $table->dateTime('worked_at');

            $table->timestamps();

            $table->index(['site_id', 'worked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labor_entries');
    }
};
