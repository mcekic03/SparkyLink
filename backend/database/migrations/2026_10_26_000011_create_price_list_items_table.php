<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('price_list_items', function (Blueprint $table) {
            $table->id();

            $table->tinyInteger('type')->default(2);
            $table->tinyInteger('currency')->default(2);

            $table->string('name');
            $table->string('unit', 20)->default('kom');
            $table->decimal('purchase_price', 14, 2)->nullable();
            $table->decimal('sale_price', 14, 2)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index(['type', 'is_active']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('price_list_items');
    }
};
