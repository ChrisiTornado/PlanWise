from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.schemas import CompanyOut, ExpenseOut, FacultyOut, LecturerOut, ProjectCategoryOut, ProjectTypeOut
from app.services import admin_service as service

router = APIRouter(tags=["lookups"], dependencies=[Depends(get_current_user)])


@router.get("/lecturers", response_model=list[LecturerOut])
def list_lecturers(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return [
        lecturer
        for faculty in service.list_faculties(db)
        for lecturer in service.list_lecturers_by_faculty(db, faculty["id"])
    ]


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_expenses(db)


@router.get("/faculties", response_model=list[FacultyOut])
def list_faculties(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_faculties(db)


@router.get("/project-types", response_model=list[ProjectTypeOut])
def list_project_types(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_project_types(db)


@router.get("/projectCategories", response_model=list[ProjectCategoryOut])
def list_project_categories(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_project_categories(db)


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_companies(db)
