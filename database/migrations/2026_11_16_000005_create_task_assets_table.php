<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('infrastructure_asset_id')->constrained('infrastructure_assets')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['task_id', 'infrastructure_asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assets');
    }
};
