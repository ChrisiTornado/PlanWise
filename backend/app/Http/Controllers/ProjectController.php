<?php

namespace App\Http\Controllers;

use App\Enums\ERole;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Mail\NewProjectMail;
use App\Repositories\Interfaces\ICompanyRepository;
use App\Repositories\Interfaces\IFacultyRepository;
use App\Repositories\Interfaces\IGroupSpecificExpenseRepository;
use App\Repositories\Interfaces\INotificationRepository;
use App\Repositories\Interfaces\IOtherExpenseRepository;
use App\Repositories\Interfaces\IProjectExpenseRepository;
use App\Repositories\Interfaces\IProjectFacultyRepository;
use App\Repositories\Interfaces\IProjectLecturerRepository;
use App\Repositories\Interfaces\IProjectRepository;
use App\Repositories\Interfaces\IProjectTypeRepository;
use App\Utils\ProjectsReportCSV;
use App\Utils\ProjectToCSV;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;


class ProjectController extends Controller
{
    public function __construct(protected IProjectRepository         $projectRepository,
                                protected IProjectLecturerRepository $projectLecturerRepository,
                                protected IProjectExpenseRepository  $projectExpenseRepository,
                                protected IProjectFacultyRepository  $projectFacultyRepository,
                                protected IOtherExpenseRepository    $otherExpenseRepository,
                                protected INotificationRepository   $notificationRepository,
                                protected IProjectTypeRepository     $projectTypeRepository,
                                protected ICompanyRepository       $companyRepository,
                                protected IFacultyRepository        $facultyRepository,
                                protected IGroupSpecificExpenseRepository $groupSpecificExpenseRepository)
    {
    }

    public function index(Request $request, int $facultyId = null)
    {
        if (!$facultyId && $request->user()->role == ERole::ADMIN)
            return ProjectResource::collection($this->projectRepository->getAll());

        return ProjectResource::collection($this->projectRepository->getWhere('faculty_id', $facultyId));
    }

    public function show(Request $request, int $facultyId, int $projectId = null)
    {
        // for admin requests, there is not facultyId provided
        if (!$projectId)
            $projectId = $facultyId;

        $project = $this->projectRepository->getOne($projectId);
        if (!$project || ($project->faculty_id != $facultyId && !$request->user()->role == ERole::ADMIN))
            return response('No projects found', 200);

        if($request->user()->role == ERole::ADMIN && !$project->is_opened)
            $this->projectRepository->updateIsOpened($projectId, true);

        return new ProjectResource($this->projectRepository->getOne($projectId));
    }

    public function getProjectsByCompanyId(Request $request, int $companyId) {
        $company = $this->companyRepository->getOne($companyId);
        if (!$company)
            return response('No projects with this company', 200);

        return ProjectResource::collection($this->projectRepository->getAllByCompanyId($companyId));
    }

    public function getFacultiesByCompanyId(Request $request, int $facultyId) {
        $faculty = $this->facultyRepository->getOne($facultyId);
        if (!$faculty)
            return response('No projects in this faculty', 200);

        return ProjectResource::collection($this->projectRepository->getAllByFacultiesId($facultyId));
    }

    public function store(StoreProjectRequest $request, int $facultyId)
    {
        $projectType = $this->projectTypeRepository->getOne($request->projectTypeId);
        if ($projectType->is_course) {
            $request->validate([
                'participants' => ['required', 'integer', 'min:1'],
                'duration' => ['required', 'integer', 'min:1'],
            ]);
        }

        try {
            DB::beginTransaction();
            $project = $this->projectRepository->create(
                $request->name,
                $request->costs,
                $request->firstname,
                $request->lastname,
                $request->email,
                Carbon::createFromFormat('Y-m-d', $request->start),
                Carbon::createFromFormat('Y-m-d', $request->end),
                $request->crossFaculty,
                $request->notes,
                $request->participants,
                $request->duration,
                $request->ects,
                $request->projectTypeId,
                $request->companyId,
                $request->user()->id,
                $facultyId
            );

            foreach (collect($request->lecturers)->unique('id')->values() as $lecturer) {
                $this->projectLecturerRepository->create($project->id, $lecturer['id'], $lecturer['hours'], $lecturer['daily']);
            }
            foreach (collect($request->expenses)->unique('id')->values() as $expense) {
                $this->projectExpenseRepository->create($project->id, $expense['id'], $expense['costs']);
            }
            foreach ($request->crossFaculties as $f) {
                $this->projectFacultyRepository->create($project->id, $f['id']);
            }

            DB::commit();

            $this->sendProjectNotifications($project);
        } catch (\Exception $e) {
            DB::rollBack();
            return response('Project could not be created: ' . $e->getMessage(), 500);
        }

        return new ProjectResource($this->projectRepository->getOne($project->id));
    }

    public function update(StoreProjectRequest $request, int $facultyId, int $projectId)
    {
        $projectType = $this->projectTypeRepository->getOne($request->projectTypeId);
        if ($projectType->is_course) {
            $request->validate([
                'participants' => ['required', 'integer', 'min:1'],
                'duration' => ['required', 'integer', 'min:1'],
                'ects' => ['required', 'integer', 'min:1'],
            ]);
        }

        try {
            DB::beginTransaction();
            $project = $this->projectRepository->update(
                $request->projectId,
                $request->name,
                $request->costs,
                $request->firstname,
                $request->lastname,
                $request->email,
                Carbon::createFromFormat('Y-m-d', $request->start),
                Carbon::createFromFormat('Y-m-d', $request->end),
                $request->crossFaculty,
                $request->notes,
                $request->participants,
                $request->duration,
                $request->ects,
                $request->projectTypeId,
                $request->companyId,
                $request->priceForCoursePerDayOverride,
            );

            $this->_updateLecturers($request->lecturers, $projectId);
            $this->_updateExpenses($request->expenses, $projectId);
            $this->_updateCrossFaculties($request->crossFaculties, $projectId);
            $this->_updateOtherExpenses($request->otherExpenses, $projectId);
            $this->_updateGroupSpecificExpenses($request->groupSpecificExpenses, $projectId);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response('Project could not be updated: ' . $e->getMessage(), 500);
        }

        return new ProjectResource($this->projectRepository->getOne($project->id));
    }

    public function destroy(int $id)
    {
        if (!$this->projectRepository->getOne($id))
            return response(null, 404);

        $this->projectRepository->delete($id);

        return response(null, 204);
    }

    public function exportToCSV(Request $request, int $facultyId, int $projectId)
    {
        $project = $this->projectRepository->getOne($projectId);
        if (!$project || $project->faculty_id != $facultyId)
            return response('Not found', 404);
        $response['csv_string'] = ProjectToCSV::getProjectCSVString($this->projectRepository->getOne($project->id), $request->user()->role == ERole::ADMIN);
        return $response;
    }

    public function exportToPDF(Request $request, int $facultyId, int $projectId)
    {
        $project = $this->projectRepository->getOne($projectId);
        if (!$project || $project->faculty_id != $facultyId)
            return response('Not found', 404);
        $isAdmin = $request->user()->role == ERole::ADMIN;

        $pdf = App::make('dompdf.wrapper');

        $costs = number_format($project->costs / 100, 2, ',', '.');
        $pricePerDay = $isAdmin ? number_format(($project->price_for_course_per_day_override ?? $project->faculty->price_for_course_per_day) / 100, 2, ',', '.') : null;

        $view = view('pdf.project-pdf', [
            'project' => $project,
            'costs' => $costs,
            'pricePerDay' => $pricePerDay,
            'isAdmin' => $isAdmin,
        ]);

        $view->render();
        $pdf->loadHTML($view);

        return $pdf->download($project->name . '.pdf');
    }

    public function report(Request $request)
    {
        if(!$request->has('ids'))
            return response(null, 404);

        $projectIds = explode(',', $request->query('ids'));
        if(empty($projectIds) || count($projectIds) == 0)
            return response(null, 404);

        $projects = $this->projectRepository->getWhereIdIn($projectIds);
        if($projects->count() == 0)
            return response(null, 404);

        if($request->user()->role == ERole::FACULTY) {
            foreach ($projects as $project) {
                if ($project->faculty_id != $request->user()->faculty_id) {
                    return response(null, 405);
                }
            }
        }

        $response['csv_string'] = ProjectsReportCSV::getProjectsReportCSVString($projects, $request->user()->role == ERole::ADMIN);
        return $response;
    }


    private function _updateLecturers(array $lecturers, $projectId)
    {
        $lecturers = collect($lecturers)->unique('id')->values()->all();
        $currentLecturerIds = $this->projectLecturerRepository->getLecturerIdsByProjectId($projectId);
        $newLecturerIds = array_map(function ($lecturer) {
            return $lecturer['id'];
        }, $lecturers);

        // Löschen von nicht mehr existierenden Lecturers
        $lecturersToDelete = array_diff($currentLecturerIds, $newLecturerIds);
        foreach ($lecturersToDelete as $lecturerId) {
            $this->projectLecturerRepository->delete($projectId, $lecturerId);
        }

        // Hinzufügen oder Aktualisieren von Lecturers
        foreach ($lecturers as $lecturer) {
            if (in_array($lecturer['id'], $currentLecturerIds)) {
                // Existierenden Lecturer aktualisieren
                $this->projectLecturerRepository->update(
                    $projectId,
                    $lecturer['id'],
                    $lecturer['hours'],
                    $lecturer['daily'],
                    $lecturer['hourlyRateOverride'],
                    $lecturer['dailyRateOverride']
                );
            } else {
                // Neuen Lecturer hinzufügen
                $this->projectLecturerRepository->create($projectId, $lecturer['id'], $lecturer['hours'], $lecturer['daily']);
            }
        }
    }

    private function _updateExpenses(array $expenses, $projectId)
    {
        $expenses = collect($expenses)->unique('id')->values()->all();
        $currentExpenseIds = $this->projectExpenseRepository->getExpenseIdsByProjectId($projectId);
        $newExpenseIds = array_map(function ($expense) {
            return $expense['id'];
        }, $expenses);

        // Löschen von nicht mehr existierenden Expenses
        $expensesToDelete = array_diff($currentExpenseIds, $newExpenseIds);
        foreach ($expensesToDelete as $expenseId) {
            $this->projectExpenseRepository->delete($projectId, $expenseId);
        }

        // Hinzufügen oder Aktualisieren von Expenses
        foreach ($expenses as $expense) {
            if (in_array($expense['id'], $currentExpenseIds)) {
                // Existierende Expense aktualisieren
                $this->projectExpenseRepository->update($projectId, $expense['id'], $expense['costs']);
            } else {
                // Neue Expense hinzufügen
                $this->projectExpenseRepository->create($projectId, $expense['id'], $expense['costs']);
            }
        }
    }

    private function _updateOtherExpenses(array $otherExpenses, $projectId)
    {
        $currentOtherExpenseIds = $this->otherExpenseRepository->getOtherExpenseIdsByProjectId($projectId);
        $newOtherExpenseIds = array_map(function ($oe) {
            return $oe['id'];
        }, $otherExpenses);

        // Löschen von nicht mehr existierenden Expenses
        $expensesToDelete = array_diff($currentOtherExpenseIds, $newOtherExpenseIds);
        foreach ($expensesToDelete as $expenseId) {
            $this->otherExpenseRepository->delete($expenseId);
        }

        // Hinzufügen oder Aktualisieren von Expenses
        foreach ($otherExpenses as $expense) {
            if (in_array($expense['id'], $currentOtherExpenseIds)) {
                // Existierende Expense aktualisieren
                $this->otherExpenseRepository->update($expense['id'],$expense['name'], $expense['costs'], $expense['perParticipant']);
            } else {
                // Neue Expense hinzufügen
                $this->otherExpenseRepository->create($expense['name'], $expense['costs'], $expense['perParticipant'], $projectId);
            }
        }
    }

    private function _updateGroupSpecificExpenses(array $groupSpecificExpenses, $projectId)
    {
        $currentGroupSpecificExpenseIds = $this->groupSpecificExpenseRepository->getGroupSpecificExpenseIdsByProjectId($projectId);
        $newGroupSpecificExpenseIds = array_map(function ($ge) {
            return $ge['id'];
        }, $groupSpecificExpenses);

        // Löschen von nicht mehr existierenden Expenses
        $expensesToDelete = array_diff($currentGroupSpecificExpenseIds, $newGroupSpecificExpenseIds);
        foreach ($expensesToDelete as $expenseId) {
            $this->groupSpecificExpenseRepository->delete($expenseId);
        }

        // Hinzufügen oder Aktualisieren von Expenses
        foreach ($groupSpecificExpenses as $expense) {
            if (in_array($expense['id'], $currentGroupSpecificExpenseIds)) {
                // Existierende Expense aktualisieren
                $this->groupSpecificExpenseRepository->update($expense['id'],$expense['name'], $expense['costs'], $expense['perParticipant']);
            } else {
                // Neue Expense hinzufügen
                $this->groupSpecificExpenseRepository->create($expense['name'], $expense['costs'], $expense['perParticipant'], $projectId);
            }
        }
    }

    private function _updateCrossFaculties(array $faculties, $projectId)
    {
        $currentFacultyIds = $this->projectFacultyRepository->getFacultyIdsByProjectId($projectId);
        $newFacultyIds = array_map(function ($f) {
            return $f['id'];
        }, $faculties);

        // Löschen von nicht mehr existierenden Faculties
        $facultiesToDelete = array_diff($currentFacultyIds, $newFacultyIds);
        foreach ($facultiesToDelete as $facultyId) {
            $this->projectFacultyRepository->delete($projectId, $facultyId);
        }

        // Hinzufügen oder Aktualisieren von Faculties
        foreach ($faculties as $f) {
            if (in_array($f['id'], $currentFacultyIds)) {
                // Existierende Faculty aktualisieren (falls nötig)
                $this->projectFacultyRepository->update($projectId, $f['id']);
            } else {
                // Neue Faculty hinzufügen
                $this->projectFacultyRepository->create($projectId, $f['id']);
            }
        }
    }

    private function sendProjectNotifications($project): void
    {
        if ($this->mailTransportIsMissingCredentials()) {
            Log::info('Project notification mails skipped because SMTP credentials are missing.', [
                'project_id' => $project->id,
            ]);
            return;
        }

        foreach ($this->notificationRepository->getAll() as $notification) {
            if(!$notification->activated) {
                continue;
            }

            try {
                Mail::to($notification->email)->send(new NewProjectMail($project));
            } catch (\Exception $mailException) {
                Log::warning('Project notification mail could not be sent', [
                    'project_id' => $project->id,
                    'notification_id' => $notification->id,
                    'message' => $mailException->getMessage(),
                ]);
            }
        }
    }

    private function mailTransportIsMissingCredentials(): bool
    {
        return config('mail.default') === 'smtp'
            && Str::of((string) config('mail.mailers.smtp.password'))->trim()->isEmpty();
    }
}
