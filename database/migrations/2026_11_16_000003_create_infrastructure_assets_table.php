<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('infrastructure_assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('asset_type'); // virtual_machine, physical_server, database, etc.
            $table->string('environment'); // production, staging, development, disaster_recovery, other
            $table->string('hostname')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('operating_system')->nullable();
            $table->string('purpose')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // active, maintenance, retired
            $table->timestamps();
            $table->softDeletes();

            $table->index(['asset_type', 'environment', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('infrastructure_assets');
    }
};
