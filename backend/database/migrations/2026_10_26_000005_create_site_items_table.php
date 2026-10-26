<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('site_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('receipt_id')->nullable()->constrained('receipts')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->tinyInteger('type')->default(1);
            // Valuta u kojoj su cene unete.
            $table->tinyInteger('currency')->default(1);

            $table->string('name');
            $table->string('unit', 20)->default('kom');
            $table->decimal('quantity', 12, 3);
            // Cene po jedinici, u valuti unosa.
            $table->decimal('purchase_price', 14, 2)->default(0);
            $table->decimal('sale_price', 14, 2)->default(0);
            // Kurs na dan stavke (dinara za 1 €); oba iznosa se racunaju pri cuvanju.
            $table->decimal('exchange_rate', 12, 4);
            $table->decimal('purchase_total_rsd', 14, 2)->default(0);
            $table->decimal('purchase_total_eur', 14, 2)->default(0);
            $table->decimal('sale_total_rsd', 14, 2)->default(0);
            $table->decimal('sale_total_eur', 14, 2)->default(0);
            $table->text('note')->nullable();

            // Ide li stavka na obracun investitoru.
            $table->boolean('is_billable')->default(true);

            $table->dateTime('occurred_at');

            $table->timestamps();

            $table->index(['site_id', 'type']);
            $table->index('occurred_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_items');
    }
};
