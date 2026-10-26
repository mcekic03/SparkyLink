<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // 1 ponuda, 2 zavrsni racun.
            $table->tinyInteger('type');
            $table->tinyInteger('currency');

            // Broj "redni/godina" (npr. 12/2026), poseban niz za svaku vrstu dokumenta.
            $table->string('number', 20);
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('sequence');
            $table->decimal('exchange_rate', 12, 4);
            $table->decimal('total_amount', 14, 2);
            $table->decimal('paid_amount', 14, 2)->default(0);
            $table->decimal('balance_amount', 14, 2);
            // Snimak stanja u trenutku izdavanja - kasnije izmene stavki ga ne menjaju.
            $table->json('snapshot');
            $table->string('pdf_path')->nullable();
            $table->text('note')->nullable();

            $table->boolean('is_itemized')->default(true);

            $table->dateTime('issued_at');

            $table->timestamps();

            $table->unique(['type', 'year', 'sequence']);
            $table->unique(['type', 'number']);
            $table->index(['site_id', 'issued_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
