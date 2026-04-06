<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('companies') && Schema::hasTable('projects')) {
            $companyId = DB::table('companies')->value('id');
            if (!$companyId) {
                $companyId = DB::table('companies')->insertGetId([
                    'name' => 'FH-Technikum',
                    'image_path' => 'company_images/fh-technikum.png',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Schema::table('projects', function (Blueprint $table) {
                if (!Schema::hasColumn('projects', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('faculty_id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                }

                if (!Schema::hasColumn('projects', 'participants')) {
                    $table->unsignedInteger('participants')->nullable()->after('cross_faculty');
                }

                if (!Schema::hasColumn('projects', 'duration')) {
                    $table->unsignedInteger('duration')->nullable()->after('participants');
                }

                if (!Schema::hasColumn('projects', 'ects')) {
                    $table->unsignedInteger('ects')->nullable()->after('duration');
                }
            });

            DB::table('projects')
                ->whereNull('company_id')
                ->update(['company_id' => $companyId]);
        }
    }

    public function down(): void
    {
        // This migration only repairs legacy local schemas. Do not remove base
        // schema columns on rollback, because fresh databases get them from
        // earlier migrations.
    }
};
