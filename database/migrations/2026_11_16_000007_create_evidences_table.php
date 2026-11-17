<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('task_update_id')->nullable()->constrained('task_updates')->nullOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('original_name');
            $table->string('storage_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size');
            $table->string('caption')->nullable();
            $table->timestamps();

            $table->index(['task_id', 'task_update_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evidences');
    }
};
