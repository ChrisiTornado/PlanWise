<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('other_expenses')) {
            Schema::table('other_expenses', function (Blueprint $table) {
                if (!Schema::hasColumn('other_expenses', 'project_id')) {
                    $table->unsignedBigInteger('project_id')->nullable();
                    $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
                }
            });

            return;
        }

        Schema::create('other_expenses', function (Blueprint $table) {
            $table->id();
            $table->timestamps();

            $table->string('name');
            $table->integer('costs');
            $table->unsignedBigInteger('project_id');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('other_expenses');
    }
};
