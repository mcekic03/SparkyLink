<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_items', function (Blueprint $table) {
            // Nabavna cena je procena (uvoz iz Excel-a): jednaka je ceni za investitora dok korisnik ne upise pravu.
            $table->boolean('is_purchase_estimated')->default(false)->after('is_billable');
        });
    }

    public function down(): void
    {
        Schema::table('site_items', function (Blueprint $table) {
            $table->dropColumn('is_purchase_estimated');
        });
    }
};
