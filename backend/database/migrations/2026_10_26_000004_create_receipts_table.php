<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->tinyInteger('status')->default(1);

            // Link sa QR koda (suf.purs.gov.rs) i njegov otisak - isti racun ne moze dvaput.
            $table->text('qr_url')->nullable();
            $table->string('qr_hash', 64)->nullable()->unique();
            $table->string('store_name')->nullable();
            $table->string('store_tin', 20)->nullable();
            $table->string('store_address')->nullable();
            $table->string('store_city')->nullable();
            $table->string('store_location')->nullable();
            $table->string('receipt_number', 100)->nullable();
            $table->string('receipt_counter', 100)->nullable();
            $table->decimal('total_amount', 14, 2)->nullable();
            // Tacan tekst racuna kakav je odstampan (za kopiju i garanciju).
            $table->longText('journal')->nullable();
            $table->json('items_data')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('fetch_error')->nullable();
            $table->unsignedTinyInteger('fetch_attempts')->default(0);
            $table->text('note')->nullable();

            $table->dateTime('issued_at')->nullable();
            $table->dateTime('fetched_at')->nullable();

            $table->timestamps();

            $table->index(['site_id', 'issued_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('receipts');
    }
};
