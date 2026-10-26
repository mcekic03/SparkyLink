<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Jedan uvezen Excel fajl prodavnice; njegove stavke mogu da se biraju zajedno.
        Schema::create('item_imports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('file_name');

            $table->timestamps();
        });

        Schema::table('site_items', function (Blueprint $table) {
            $table->foreignId('item_import_id')->nullable()->after('receipt_id')->constrained('item_imports')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('site_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('item_import_id');
        });

        Schema::dropIfExists('item_imports');
    }
};
