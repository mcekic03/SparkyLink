<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('site_media', function (Blueprint $table) {
            $table->id();

            $table->foreignId('site_id')->constrained('sites');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->tinyInteger('type');

            $table->string('disk', 30)->default('local');
            $table->string('path');
            $table->string('thumbnail_path')->nullable();
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('caption')->nullable();

            $table->dateTime('taken_at')->nullable();

            $table->timestamps();

            $table->index(['site_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_media');
    }
};
