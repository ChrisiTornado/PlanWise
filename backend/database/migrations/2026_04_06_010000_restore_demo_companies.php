<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('companies')) {
            return;
        }

        $companies = [
            ['name' => 'FH-Technikum', 'image_path' => 'company_images/fh-technikum.png'],
            ['name' => 'IBM', 'image_path' => 'company_images/ibm.png'],
            ['name' => 'Stadt Wien', 'image_path' => 'company_images/stadt-wien.png'],
            ['name' => 'Fabasoft', 'image_path' => 'company_images/fabasoft.png'],
            ['name' => 'Accenture', 'image_path' => 'company_images/accenture.png'],
            ['name' => 'SAP', 'image_path' => 'company_images/sap.png'],
            ['name' => 'Erste Bank', 'image_path' => 'company_images/erste-bank.png'],
            ['name' => 'Paysafe', 'image_path' => 'company_images/paysafe.png'],
            ['name' => 'Asfinag', 'image_path' => 'company_images/asfinag.png'],
        ];

        foreach ($companies as $company) {
            DB::table('companies')->updateOrInsert(
                ['name' => $company['name']],
                [
                    'image_path' => $company['image_path'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    public function down(): void
    {
    }
};
