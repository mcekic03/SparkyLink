<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->tinyInteger('currency')->default(2);

            $table->decimal('amount', 14, 2);
            $table->decimal('exchange_rate', 12, 4);
            $table->decimal('amount_rsd', 14, 2)->default(0);
            $table->decimal('amount_eur', 14, 2)->default(0);
            $table->string('note')->nullable();

            $table->dateTime('paid_at');

            $table->timestamps();

            $table->index(['site_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
