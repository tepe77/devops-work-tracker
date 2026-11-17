<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_updates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->date('activity_date');
            $table->string('summary');
            $table->text('work_done');
            $table->text('result')->nullable();
            $table->text('blocker')->nullable();
            $table->text('next_action')->nullable();
            $table->unsignedTinyInteger('progress_percent');
            $table->string('status');
            $table->timestamps();

            $table->index(['activity_date', 'task_id']);
            $table->index(['task_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_updates');
    }
};
