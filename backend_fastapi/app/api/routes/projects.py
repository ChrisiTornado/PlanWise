from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_faculty_access
from app.db.session import get_db
from app.models import Role, User
from app.schemas import CsvExportOut, ProjectOut, StoreProjectRequest
from app.services import export_service, project_service

router = APIRouter(tags=["projects"])


@router.get("/projects/report", response_model=CsvExportOut)
def projects_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    ids: Annotated[str | None, Query()] = None,
) -> dict[str, str]:
    project_ids = [int(item) for item in ids.split(",") if item.strip().isdigit()] if ids else []
    projects = project_service.get_projects_for_report(db, project_ids, current_user)
    return {
        "csv_string": export_service.projects_report_csv_string(
            projects,
            is_admin=current_user.role == Role.ADMIN.value,
        )
    }


@router.get("/faculties/{faculty_id}/projects", response_model=list[ProjectOut])
def list_faculty_projects(
    faculty_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> list[dict]:
    return project_service.list_faculty_projects(db, faculty_id, current_user)


@router.post("/faculties/{faculty_id}/projects", response_model=ProjectOut)
def create_faculty_project(
    faculty_id: int,
    payload: StoreProjectRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> dict:
    return project_service.create_faculty_project(db, faculty_id, payload, current_user)


@router.get("/faculties/{faculty_id}/projects/{project_id}", response_model=ProjectOut)
def get_faculty_project(
    faculty_id: int,
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> dict:
    return project_service.get_faculty_project(db, faculty_id, project_id, current_user)


@router.put("/faculties/{faculty_id}/projects/{project_id}", response_model=ProjectOut)
@router.patch("/faculties/{faculty_id}/projects/{project_id}", response_model=ProjectOut)
def update_faculty_project(
    faculty_id: int,
    project_id: int,
    payload: StoreProjectRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> dict:
    return project_service.update_project(db, faculty_id, project_id, payload, current_user)


@router.get("/faculties/{faculty_id}/projects/{project_id}/csv", response_model=CsvExportOut)
def export_faculty_project_csv(
    faculty_id: int,
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> dict[str, str]:
    project = project_service._get_project(db, project_id)
    if project.faculty_id != faculty_id:
        project_service._not_found("Not found")
    return {
        "csv_string": export_service.project_csv_string(
            project,
            is_admin=current_user.role == Role.ADMIN.value,
        )
    }


@router.get("/faculties/{faculty_id}/projects/{project_id}/pdf")
def export_faculty_project_pdf(
    faculty_id: int,
    project_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_faculty_access)],
) -> Response:
    project = project_service._get_project(db, project_id)
    if project.faculty_id != faculty_id:
        project_service._not_found("Not found")
    return Response(
        content=export_service.project_pdf_bytes(project, is_admin=current_user.role == Role.ADMIN.value),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{project.name}.pdf"'},
    )
