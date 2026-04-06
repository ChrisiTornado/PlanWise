<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectCategory\StoreProjectCategoryRequest;
use App\Http\Resources\ProjectCategoryResource;
use App\Repositories\Interfaces\IProjectCategoryRepository;

class ProjectCategoryController extends Controller
{
    public function __construct(protected IProjectCategoryRepository $projectCategoryRepository)
    {}

    public function index()
    {
        return ProjectCategoryResource::collection($this->projectCategoryRepository->getAll());
    }

    public function show(int $id)
    {
        $projectCategory = $this->projectCategoryRepository->getOne($id);
        if (!$projectCategory)
            return response(null, 404);

        return new ProjectCategoryResource($projectCategory);
    }

    public function store(StoreProjectCategoryRequest $request)
    {
        return new ProjectCategoryResource($this->projectCategoryRepository->create($request->name));
    }

    public function update(StoreProjectCategoryRequest $request, int $id)
    {
        if(!$this->projectCategoryRepository->getOne($id))
            return response(null, 404);

        return new ProjectCategoryResource($this->projectCategoryRepository->update($id, $request->name));
    }

    public function destroy(int $id)
    {
        if(!$this->projectCategoryRepository->getOne($id))
            return response(null, 404);

        $this->projectCategoryRepository->delete($id);

        return response(null, 204);
    }
}
