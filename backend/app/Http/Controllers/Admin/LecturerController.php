<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;
use App\Http\Requests\Lecturer\StoreLecturerRequest;
use App\Http\Resources\LecturerResource;
use App\Models\Faculty;
use App\Repositories\Interfaces\ILecturerRepository;


class LecturerController extends Controller
{
    public function __construct(protected ILecturerRepository $lecturerRepository)
    {}

    public function index(int $facultyId)
    {
        return LecturerResource::collection($this->lecturerRepository->getWhere('faculty_id', $facultyId));
    }

    public function show(int $facultyId, int $id)
    {
        $lecturer = $this->lecturerRepository->getOne($id);
        if (!$lecturer || $lecturer->faculty_id !== $facultyId)
            return response(null, 404);

        return new LecturerResource($lecturer);
    }

    public function store(StoreLecturerRequest $request, Faculty $faculty)
    {
        return new LecturerResource($this->lecturerRepository->create(
            $request->name,
            $request->hourlyRate,
            $request->dailyRate,
            $faculty->id
        ));
    }

   public function update(StoreLecturerRequest $request, int $facultyId, int $id)
   {
       $lecturer = $this->lecturerRepository->getOne($id);
       if (!$lecturer || $lecturer->faculty_id !== $facultyId)
           return response(null, 404);

       return new LecturerResource($this->lecturerRepository->update($id, $request->name, $request->hourlyRate, $request->dailyRate, $facultyId));
   }

    public function destroy(int $facultyId, int $id)
    {
        $lecturer = $this->lecturerRepository->getOne($id);
        if (!$lecturer || $lecturer->faculty_id !== $facultyId)
            return response(null, 404);

        $this->lecturerRepository->delete($id);

        return response(null, 204);
    }
}
