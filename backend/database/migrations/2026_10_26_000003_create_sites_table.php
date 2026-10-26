<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            // 1 ponuda (ceka odgovor investitora), 2 otvoreno, 3 zatvoreno.
            $table->tinyInteger('status')->default(2);
            // Valuta obracuna sa investitorom (dug se racuna u njoj).
            $table->tinyInteger('currency')->default(2);

            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('investor_name')->nullable();
            $table->string('investor_phone', 50)->nullable();
            $table->string('investor_email')->nullable();
            $table->string('investor_address')->nullable();
            $table->text('description')->nullable();
            // Prazno = podrazumevana marza iz podesavanja.
            $table->decimal('markup_percent', 6, 2)->nullable();

            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'deleted_at']);
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};
