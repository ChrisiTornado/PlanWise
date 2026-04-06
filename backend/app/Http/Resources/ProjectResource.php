<?php

namespace App\Http\Resources;

use App\Enums\ERole;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{

    public function toArray($request)
    {
        $isAdmin = $request->user()?->role == ERole::ADMIN;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'costs' => ($isAdmin ? $this->costs : $this->getFacultyVisibleCosts()) / 100,
            'firstname' => $this->firstname,
            'lastname' => $this->lastname,
            'email' => $this->email,
            'start' => $this->start->format('Y-m-d'),
            'end' => $this->end->format('Y-m-d'),
            'notes' => $this->notes,
            'participants' => $this->participants,
            'duration' => $this->duration,
            'ects' => $this->ects,
            'crossFaculty' => $this->cross_faculty,
            'userId' => $this->user->id,
            'isOpened' => $this->is_opened,
            'faculty' => new FacultyResource($this->faculty),
            'projectType' => new ProjectTypeResource($this->projectType),
            'company' => new CompanyResource($this->company),
            'state' => $this->state,
            'stateChangedAt' => $this->state_changed_at?->format('Y-m-d H:i:s'),
            'createdAt' => $this->created_at?->format('Y-m-d H:i:s'),
            'lecturers' => ProjectLecturerResource::collection($this->lecturers),
            'expenses' => ProjectExpenseResource::collection($this->expenses),
            'crossFaculties' => $this->faculties->map(function ($item, int $key) {
                return $item->faculty;
            }),
            'priceForCoursePerDayOverride' => $this->price_for_course_per_day_override ? $this->price_for_course_per_day_override / 100 : null,
            'otherExpenses' => $isAdmin ? OtherExpenseResource::collection($this->otherExpenses) : [],
            'groupSpecificExpenses' => $isAdmin ? GroupSpecificExpenseResource::collection($this->groupSpecificExpenses) : []
        ];
    }

    private function getFacultyVisibleCosts(): int
    {
        $lecturerCosts = $this->lecturers->sum(function ($projectLecturer) {
            $rate = $projectLecturer->daily
                ? $projectLecturer->daily_rate_override ?? $projectLecturer->lecturer->daily_rate
                : $projectLecturer->hourly_rate_override ?? $projectLecturer->lecturer->hourly_rate;

            return $projectLecturer->hours * $rate;
        });

        return $lecturerCosts + $this->expenses->sum('costs');
    }
}
