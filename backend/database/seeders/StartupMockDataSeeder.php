<?php

namespace Database\Seeders;

use App\Enums\EProjectState;
use App\Enums\ERole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StartupMockDataSeeder extends Seeder
{
    private array $facultyIds = [];
    private array $lecturerIds = [];
    private array $expenseIds = [];
    private array $projectTypeIds = [];
    private array $companyIds = [];
    private array $userIds = [];

    public function run(): void
    {
        $this->seedFaculties();
        $this->seedUsers();
        $this->seedLecturers();
        $this->seedExpenses();
        $this->seedProjectTypes();
        $this->seedCompanies();
        $this->seedNotifications();
        $this->seedProjects();
    }

    private function seedFaculties(): void
    {
        foreach ([
            ['name' => 'Informatik & Wirtschaft', 'price_for_course_per_day' => 22000],
            ['name' => 'Industrial Engineering', 'price_for_course_per_day' => 21000],
            ['name' => 'Life Science Engineering', 'price_for_course_per_day' => 24000],
            ['name' => 'Electronic Engineering', 'price_for_course_per_day' => 20000],
        ] as $faculty) {
            $this->facultyIds[$faculty['name']] = $this->upsertByName('faculties', $faculty);
        }
    }

    private function seedUsers(): void
    {
        $users = [
            ['email' => 'admin@technikum-wien.at', 'role' => ERole::ADMIN->value, 'faculty' => null],
            ['email' => 'informatik@technikum-wien.at', 'role' => ERole::FACULTY->value, 'faculty' => 'Informatik & Wirtschaft'],
            ['email' => 'industrial-engineering@technikum-wien.at', 'role' => ERole::FACULTY->value, 'faculty' => 'Industrial Engineering'],
            ['email' => 'life-science@technikum-wien.at', 'role' => ERole::FACULTY->value, 'faculty' => 'Life Science Engineering'],
            ['email' => 'electronic-engineering@technikum-wien.at', 'role' => ERole::FACULTY->value, 'faculty' => 'Electronic Engineering'],
        ];

        foreach ($users as $user) {
            DB::table('users')->updateOrInsert(
                ['email' => $user['email']],
                [
                    'password' => Hash::make('123456'),
                    'role' => $user['role'],
                    'faculty_id' => $user['faculty'] ? $this->facultyIds[$user['faculty']] : null,
                    'email_verified_at' => now(),
                    'password_reset' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $this->userIds[$user['email']] = DB::table('users')->where('email', $user['email'])->value('id');
        }
    }

    private function seedLecturers(): void
    {
        $lecturers = [
            ['name' => 'Dr. Anna Berger', 'hourly_rate' => 7500, 'daily_rate' => 56000, 'faculty' => 'Informatik & Wirtschaft'],
            ['name' => 'DI Markus Steiner', 'hourly_rate' => 6800, 'daily_rate' => 52000, 'faculty' => 'Informatik & Wirtschaft'],
            ['name' => 'Prof. Eva Schmid', 'hourly_rate' => 7200, 'daily_rate' => 54000, 'faculty' => 'Industrial Engineering'],
            ['name' => 'Dr. Lukas Weber', 'hourly_rate' => 6400, 'daily_rate' => 50000, 'faculty' => 'Industrial Engineering'],
            ['name' => 'DI Nora Fischer', 'hourly_rate' => 7000, 'daily_rate' => 54000, 'faculty' => 'Life Science Engineering'],
            ['name' => 'Dr. Paul Gruber', 'hourly_rate' => 6600, 'daily_rate' => 51000, 'faculty' => 'Electronic Engineering'],
        ];

        foreach ($lecturers as $lecturer) {
            $this->lecturerIds[$lecturer['name']] = $this->upsertByName('lecturers', [
                'name' => $lecturer['name'],
                'hourly_rate' => $lecturer['hourly_rate'],
                'daily_rate' => $lecturer['daily_rate'],
                'faculty_id' => $this->facultyIds[$lecturer['faculty']],
            ]);
        }
    }

    private function seedExpenses(): void
    {
        foreach (['Reiseaufwand', 'Bewirtung', 'Marketing und Werbung', 'Software-Lizenzen', 'Laborverbrauchsmaterial', 'Externe Beratung'] as $expense) {
            $this->expenseIds[$expense] = $this->upsertByName('expenses', ['name' => $expense]);
        }
    }

    private function seedProjectTypes(): void
    {
        foreach ([
            ['name' => 'Lehrgänge', 'code' => 'LG', 'is_course' => true],
            ['name' => 'Seminare', 'code' => 'SE', 'is_course' => true],
            ['name' => 'Internes Projekt', 'code' => 'IP', 'is_course' => false],
            ['name' => 'Förderprojekte', 'code' => 'FP', 'is_course' => false],
            ['name' => 'Industrieprojekt', 'code' => 'IND', 'is_course' => false],
        ] as $type) {
            $this->projectTypeIds[$type['name']] = $this->upsertByName('project_types', $type);
        }
    }

    private function seedCompanies(): void
    {
        foreach ([
            ['name' => 'FH-Technikum', 'image_path' => 'company_images/fh-technikum.png'],
            ['name' => 'IBM', 'image_path' => 'company_images/ibm.png'],
            ['name' => 'Stadt Wien', 'image_path' => 'company_images/stadt-wien.png'],
            ['name' => 'Fabasoft', 'image_path' => 'company_images/fabasoft.png'],
            ['name' => 'Accenture', 'image_path' => 'company_images/accenture.png'],
            ['name' => 'SAP', 'image_path' => 'company_images/sap.png'],
            ['name' => 'Erste Bank', 'image_path' => 'company_images/erste-bank.png'],
            ['name' => 'Paysafe', 'image_path' => 'company_images/paysafe.png'],
            ['name' => 'Asfinag', 'image_path' => 'company_images/asfinag.png'],
        ] as $company) {
            $this->companyIds[$company['name']] = $this->upsertByName('companies', $company);
        }
    }

    private function seedNotifications(): void
    {
        foreach ([
            ['email' => 'admin@technikum-wien.at', 'activated' => true],
            ['email' => 'controlling@technikum-wien.at', 'activated' => true],
            ['email' => 'projektkoordination@technikum-wien.at', 'activated' => false],
        ] as $notification) {
            DB::table('notifications')->updateOrInsert(
                ['email' => $notification['email']],
                [
                    'activated' => $notification['activated'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function seedProjects(): void
    {
        $projects = [
            [
                'name' => 'Data Analytics Bootcamp',
                'project_type' => 'Seminare',
                'company' => 'IBM',
                'faculty' => 'Informatik & Wirtschaft',
                'cross_faculties' => ['Industrial Engineering'],
                'user' => 'informatik@technikum-wien.at',
                'participants' => 18,
                'duration' => 4,
                'ects' => 3,
                'price_for_course_per_day_override' => 24000,
                'state' => EProjectState::APPROVED->value,
                'is_opened' => true,
                'lecturers' => [
                    ['name' => 'Dr. Anna Berger', 'hours' => 4, 'daily' => true],
                    ['name' => 'DI Markus Steiner', 'hours' => 10, 'daily' => false],
                ],
                'expenses' => [
                    ['name' => 'Software-Lizenzen', 'costs' => 160000],
                    ['name' => 'Bewirtung', 'costs' => 90000],
                ],
                'other_expenses' => [
                    ['name' => 'Seminarunterlagen', 'costs' => 1800, 'per_participant' => true],
                    ['name' => 'Raumtechnik', 'costs' => 45000, 'per_participant' => false],
                ],
                'group_specific_expenses' => [
                    ['name' => 'Cloud-Lab Umgebung', 'costs' => 2200, 'per_participant' => true],
                ],
            ],
            [
                'name' => 'Smart City IoT Pilot',
                'project_type' => 'Industrieprojekt',
                'company' => 'Stadt Wien',
                'faculty' => 'Electronic Engineering',
                'user' => 'electronic-engineering@technikum-wien.at',
                'participants' => null,
                'duration' => null,
                'ects' => null,
                'state' => EProjectState::SUBMITTED->value,
                'is_opened' => false,
                'lecturers' => [
                    ['name' => 'Dr. Paul Gruber', 'hours' => 38, 'daily' => false],
                ],
                'expenses' => [
                    ['name' => 'Laborverbrauchsmaterial', 'costs' => 240000],
                    ['name' => 'Reiseaufwand', 'costs' => 60000],
                ],
                'other_expenses' => [
                    ['name' => 'Sensor-Prototypen', 'costs' => 180000, 'per_participant' => false],
                ],
                'group_specific_expenses' => [],
            ],
            [
                'name' => 'Lean Production Workshop',
                'project_type' => 'Seminare',
                'company' => 'Asfinag',
                'faculty' => 'Industrial Engineering',
                'user' => 'industrial-engineering@technikum-wien.at',
                'participants' => 8,
                'duration' => 3,
                'ects' => 2,
                'price_for_course_per_day_override' => 19000,
                'state' => EProjectState::SUBMITTED->value,
                'is_opened' => false,
                'lecturers' => [
                    ['name' => 'Prof. Eva Schmid', 'hours' => 3, 'daily' => true],
                    ['name' => 'Dr. Lukas Weber', 'hours' => 8, 'daily' => false],
                ],
                'expenses' => [
                    ['name' => 'Bewirtung', 'costs' => 70000],
                    ['name' => 'Reiseaufwand', 'costs' => 50000],
                ],
                'other_expenses' => [
                    ['name' => 'Planspielmaterial', 'costs' => 1200, 'per_participant' => true],
                ],
                'group_specific_expenses' => [
                    ['name' => 'Workshop-Setup', 'costs' => 90000, 'per_participant' => false],
                ],
            ],
            [
                'name' => 'Regulatory Affairs Grundlagen',
                'project_type' => 'Lehrgänge',
                'company' => 'Accenture',
                'faculty' => 'Life Science Engineering',
                'user' => 'life-science@technikum-wien.at',
                'participants' => 12,
                'duration' => 5,
                'ects' => 4,
                'price_for_course_per_day_override' => 23000,
                'state' => EProjectState::REJECTED->value,
                'is_opened' => true,
                'lecturers' => [
                    ['name' => 'DI Nora Fischer', 'hours' => 5, 'daily' => true],
                ],
                'expenses' => [
                    ['name' => 'Externe Beratung', 'costs' => 180000],
                    ['name' => 'Marketing und Werbung', 'costs' => 60000],
                ],
                'other_expenses' => [
                    ['name' => 'Zertifikatsunterlagen', 'costs' => 2500, 'per_participant' => true],
                ],
                'group_specific_expenses' => [],
            ],
            [
                'name' => 'Payment Security Review',
                'project_type' => 'Industrieprojekt',
                'company' => 'Paysafe',
                'faculty' => 'Informatik & Wirtschaft',
                'user' => 'informatik@technikum-wien.at',
                'participants' => null,
                'duration' => null,
                'ects' => null,
                'state' => EProjectState::APPROVED->value,
                'is_opened' => true,
                'lecturers' => [
                    ['name' => 'Dr. Anna Berger', 'hours' => 24, 'daily' => false],
                    ['name' => 'DI Markus Steiner', 'hours' => 18, 'daily' => false],
                ],
                'expenses' => [
                    ['name' => 'Software-Lizenzen', 'costs' => 90000],
                ],
                'other_expenses' => [
                    ['name' => 'Penetration-Test Umgebung', 'costs' => 120000, 'per_participant' => false],
                ],
                'group_specific_expenses' => [],
            ],
            [
                'name' => 'ERP Integration Prototype',
                'project_type' => 'Förderprojekte',
                'company' => 'SAP',
                'faculty' => 'Informatik & Wirtschaft',
                'user' => 'informatik@technikum-wien.at',
                'participants' => null,
                'duration' => null,
                'ects' => null,
                'state' => EProjectState::SUBMITTED->value,
                'is_opened' => false,
                'lecturers' => [
                    ['name' => 'DI Markus Steiner', 'hours' => 32, 'daily' => false],
                ],
                'expenses' => [
                    ['name' => 'Software-Lizenzen', 'costs' => 210000],
                    ['name' => 'Externe Beratung', 'costs' => 140000],
                ],
                'other_expenses' => [],
                'group_specific_expenses' => [],
            ],
        ];

        foreach ($projects as $index => $project) {
            $projectId = $this->upsertProject($project, $index);
            $this->syncProjectLecturers($projectId, $project['lecturers']);
            $this->syncProjectExpenses($projectId, $project['expenses']);
            $this->syncOtherExpenses($projectId, $project['other_expenses']);
            $this->syncGroupSpecificExpenses($projectId, $project['group_specific_expenses']);
            $this->syncProjectFaculties($projectId, $project['cross_faculties'] ?? []);
        }
    }

    private function upsertProject(array $project, int $index): int
    {
        $facultyId = $this->facultyIds[$project['faculty']];
        $priceForCoursePerDay = $project['price_for_course_per_day_override']
            ?? DB::table('faculties')->where('id', $facultyId)->value('price_for_course_per_day');
        $costs = $this->calculateProjectCosts($project);

        DB::table('projects')->updateOrInsert(
            ['name' => $project['name']],
            [
                'costs' => $costs,
                'project_type_id' => $this->projectTypeIds[$project['project_type']],
                'company_id' => $this->companyIds[$project['company']],
                'user_id' => $this->userIds[$project['user']],
                'faculty_id' => $facultyId,
                'firstname' => 'Max',
                'lastname' => 'Mustermann',
                'email' => 'kontakt+'.strtolower(str_replace(' ', '-', $project['name'])).'@example.com',
                'start' => Carbon::now()->addWeeks($index + 1)->format('Y-m-d'),
                'end' => Carbon::now()->addWeeks($index + 1)->addDays($project['duration'] ?? 14)->format('Y-m-d'),
                'cross_faculty' => !empty($project['cross_faculties']),
                'notes' => 'Automatisch erstellter Mock-Datensatz für Entwicklung und Demo.',
                'participants' => $project['participants'],
                'duration' => $project['duration'],
                'ects' => $project['ects'],
                'is_opened' => $project['is_opened'],
                'price_for_course_per_day_override' => $project['participants'] ? $priceForCoursePerDay : null,
                'state' => $project['state'],
                'state_changed_at' => now(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return DB::table('projects')->where('name', $project['name'])->value('id');
    }

    private function syncProjectLecturers(int $projectId, array $lecturers): void
    {
        $lecturerIds = array_map(fn ($lecturer) => $this->lecturerIds[$lecturer['name']], $lecturers);
        DB::table('project_lecturer')
            ->where('project_id', $projectId)
            ->when($lecturerIds, fn ($query) => $query->whereNotIn('lecturer_id', $lecturerIds))
            ->delete();

        foreach ($lecturers as $lecturer) {
            DB::table('project_lecturer')->updateOrInsert(
                ['project_id' => $projectId, 'lecturer_id' => $this->lecturerIds[$lecturer['name']]],
                [
                    'hours' => $lecturer['hours'],
                    'daily' => $lecturer['daily'],
                    'hourly_rate_override' => null,
                    'daily_rate_override' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function syncProjectExpenses(int $projectId, array $expenses): void
    {
        $expenseIds = array_map(fn ($expense) => $this->expenseIds[$expense['name']], $expenses);
        DB::table('project_expense')
            ->where('project_id', $projectId)
            ->when($expenseIds, fn ($query) => $query->whereNotIn('expense_id', $expenseIds))
            ->delete();

        foreach ($expenses as $expense) {
            DB::table('project_expense')->updateOrInsert(
                ['project_id' => $projectId, 'expense_id' => $this->expenseIds[$expense['name']]],
                [
                    'costs' => $expense['costs'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function syncOtherExpenses(int $projectId, array $expenses): void
    {
        $expenseNames = array_column($expenses, 'name');
        DB::table('other_expenses')
            ->where('project_id', $projectId)
            ->when($expenseNames, fn ($query) => $query->whereNotIn('name', $expenseNames))
            ->delete();

        foreach ($expenses as $expense) {
            DB::table('other_expenses')->updateOrInsert(
                ['project_id' => $projectId, 'name' => $expense['name']],
                [
                    'costs' => $expense['costs'],
                    'per_participant' => $expense['per_participant'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function syncGroupSpecificExpenses(int $projectId, array $expenses): void
    {
        $expenseNames = array_column($expenses, 'name');
        DB::table('group_specific_expenses')
            ->where('project_id', $projectId)
            ->when($expenseNames, fn ($query) => $query->whereNotIn('name', $expenseNames))
            ->delete();

        foreach ($expenses as $expense) {
            DB::table('group_specific_expenses')->updateOrInsert(
                ['project_id' => $projectId, 'name' => $expense['name']],
                [
                    'costs' => $expense['costs'],
                    'per_participant' => $expense['per_participant'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function syncProjectFaculties(int $projectId, array $facultyNames): void
    {
        $facultyIds = array_map(fn ($facultyName) => $this->facultyIds[$facultyName], $facultyNames);
        DB::table('project_faculty')
            ->where('project_id', $projectId)
            ->when($facultyIds, fn ($query) => $query->whereNotIn('faculty_id', $facultyIds))
            ->delete();

        foreach ($facultyIds as $facultyId) {
            DB::table('project_faculty')->updateOrInsert(
                ['project_id' => $projectId, 'faculty_id' => $facultyId],
                [
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    private function calculateProjectCosts(array $project): int
    {
        $participants = $project['participants'] ?? 0;
        $lecturerCosts = collect($project['lecturers'])->sum(function ($projectLecturer) {
            $lecturer = DB::table('lecturers')->where('id', $this->lecturerIds[$projectLecturer['name']])->first();
            return $projectLecturer['hours'] * ($projectLecturer['daily'] ? $lecturer->daily_rate : $lecturer->hourly_rate);
        });
        $expenseCosts = collect($project['expenses'])->sum('costs');
        $otherCosts = collect($project['other_expenses'])->sum(fn ($expense) => $expense['per_participant'] ? $expense['costs'] * $participants : $expense['costs']);
        $groupSpecificCosts = collect($project['group_specific_expenses'])->sum(fn ($expense) => $expense['per_participant'] ? $expense['costs'] * $participants : $expense['costs']);

        return $lecturerCosts + $expenseCosts + $otherCosts + $groupSpecificCosts;
    }

    private function upsertByName(string $table, array $attributes): int
    {
        DB::table($table)->updateOrInsert(
            ['name' => $attributes['name']],
            array_merge($attributes, [
                'updated_at' => now(),
                'created_at' => now(),
            ])
        );

        return DB::table($table)->where('name', $attributes['name'])->value('id');
    }
}
