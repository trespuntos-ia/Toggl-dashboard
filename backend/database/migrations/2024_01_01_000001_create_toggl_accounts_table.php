<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('toggl_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('api_token');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('toggl_accounts');
    }
};
