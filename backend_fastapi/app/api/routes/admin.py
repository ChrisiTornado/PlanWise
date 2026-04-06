from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_admin
from app.db.session import get_db
from app.models import User
from app.schemas import (
    CompanyOut,
    ExpenseOut,
    FacultyOut,
    LecturerOut,
    NotificationOut,
    ProjectCategoryOut,
    ProjectOut,
    ProjectTypeOut,
    StoreExpenseRequest,
    StoreFacultyRequest,
    StoreLecturerRequest,
    StoreProjectRequest,
    StoreProjectCategoryRequest,
    StoreProjectTypeRequest,
    StoreUserRequest,
    UpdateNotificationRequest,
    UpdateProjectStateRequest,
    UserOut,
)
from app.services import admin_service as service
from app.services import project_service

router = APIRouter(tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/companies", response_model=list[CompanyOut])
def list_companies(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_companies(db)


@router.post("/companies", response_model=CompanyOut)
def create_company(
    db: Annotated[Session, Depends(get_db)],
    companyName: Annotated[str, Form()],
    file: Annotated[UploadFile | None, File()] = None,
) -> dict:
    return service.create_company(db, companyName, file)


@router.get("/companies/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_company(db, company_id)


@router.post("/companies/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    db: Annotated[Session, Depends(get_db)],
    companyName: Annotated[str, Form()],
    file: Annotated[UploadFile | None, File()] = None,
) -> dict:
    return service.update_company(db, company_id, companyName, file)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_company(db, company_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/faculties/{faculty_id}/lecturers", response_model=list[LecturerOut])
def list_lecturers_by_faculty(faculty_id: int, db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_lecturers_by_faculty(db, faculty_id)


@router.post("/faculties/{faculty_id}/lecturers", response_model=LecturerOut)
def create_lecturer(faculty_id: int, payload: StoreLecturerRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_lecturer(db, faculty_id, payload.name, payload.hourlyRate, payload.dailyRate)


@router.get("/faculties/{faculty_id}/lecturers/{lecturer_id}", response_model=LecturerOut)
def get_lecturer(faculty_id: int, lecturer_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_lecturer(db, faculty_id, lecturer_id)


@router.put("/faculties/{faculty_id}/lecturers/{lecturer_id}", response_model=LecturerOut)
@router.patch("/faculties/{faculty_id}/lecturers/{lecturer_id}", response_model=LecturerOut)
def update_lecturer(
    faculty_id: int,
    lecturer_id: int,
    payload: StoreLecturerRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return service.update_lecturer(db, faculty_id, lecturer_id, payload.name, payload.hourlyRate, payload.dailyRate)


@router.delete("/faculties/{faculty_id}/lecturers/{lecturer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lecturer(faculty_id: int, lecturer_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_lecturer(db, faculty_id, lecturer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/faculties", response_model=list[FacultyOut])
def list_faculties(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_faculties(db)


@router.post("/faculties", response_model=FacultyOut)
def create_faculty(payload: StoreFacultyRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_faculty(db, payload.name, payload.priceForCoursePerDay)


@router.get("/faculties/{faculty_id}", response_model=FacultyOut)
def get_faculty(faculty_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_faculty(db, faculty_id)


@router.put("/faculties/{faculty_id}", response_model=FacultyOut)
@router.patch("/faculties/{faculty_id}", response_model=FacultyOut)
def update_faculty(faculty_id: int, payload: StoreFacultyRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.update_faculty(db, faculty_id, payload.name, payload.priceForCoursePerDay)


@router.delete("/faculties/{faculty_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faculty(faculty_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_faculty(db, faculty_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/users", response_model=list[UserOut])
def list_users(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_faculty_users(db)


@router.post("/users", response_model=UserOut)
def create_user(payload: StoreUserRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_faculty_user(db, payload.email, payload.faculty_id)


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_user(db, user_id)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_user(db, user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/expenses", response_model=list[ExpenseOut])
def list_expenses(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_expenses(db)


@router.post("/expenses", response_model=ExpenseOut)
def create_expense(payload: StoreExpenseRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_expense(db, payload.name)


@router.get("/expenses/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_expense(db, expense_id)


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
@router.patch("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(expense_id: int, payload: StoreExpenseRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.update_expense(db, expense_id, payload.name)


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_expense(db, expense_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/project-types", response_model=list[ProjectTypeOut])
def list_project_types(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_project_types(db)


@router.post("/project-types", response_model=ProjectTypeOut)
def create_project_type(payload: StoreProjectTypeRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_project_type(db, payload.name, payload.code, payload.isCourse)


@router.get("/project-types/{project_type_id}", response_model=ProjectTypeOut)
def get_project_type(project_type_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_project_type(db, project_type_id)


@router.put("/project-types/{project_type_id}", response_model=ProjectTypeOut)
@router.patch("/project-types/{project_type_id}", response_model=ProjectTypeOut)
def update_project_type(
    project_type_id: int,
    payload: StoreProjectTypeRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return service.update_project_type(db, project_type_id, payload.name, payload.code, payload.isCourse)


@router.delete("/project-types/{project_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_type(project_type_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_project_type(db, project_type_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/projectCategories", response_model=list[ProjectCategoryOut])
def list_project_categories(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_project_categories(db)


@router.post("/projectCategories", response_model=ProjectCategoryOut)
def create_project_category(payload: StoreProjectCategoryRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.create_project_category(db, payload.name)


@router.get("/projectCategories/{project_category_id}", response_model=ProjectCategoryOut)
def get_project_category(project_category_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return service.get_project_category(db, project_category_id)


@router.put("/projectCategories/{project_category_id}", response_model=ProjectCategoryOut)
@router.patch("/projectCategories/{project_category_id}", response_model=ProjectCategoryOut)
def update_project_category(
    project_category_id: int,
    payload: StoreProjectCategoryRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return service.update_project_category(db, project_category_id, payload.name)


@router.delete("/projectCategories/{project_category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_category(project_category_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    service.delete_project_category(db, project_category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return service.list_notifications(db)


@router.put("/notifications/{notification_id}", response_model=NotificationOut)
@router.patch("/notifications/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    payload: UpdateNotificationRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return service.update_notification(db, notification_id, payload.email, payload.activated)


@router.get("/projects", response_model=list[ProjectOut])
def list_admin_projects(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
) -> list[dict]:
    return project_service.list_admin_projects(db, current_user)


@router.get("/projects/fetch-companies/{company_id}", response_model=list[ProjectOut])
def admin_projects_by_company(company_id: int, db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return project_service.get_projects_by_company_id(db, company_id)


@router.get("/projects/fetch-faculties/{faculty_id}", response_model=list[ProjectOut])
def admin_projects_by_faculty(faculty_id: int, db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return project_service.get_projects_by_faculty_id(db, faculty_id)


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_admin_project(project_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    return project_service.get_admin_project(db, project_id)


@router.put("/projects/{project_id}", response_model=ProjectOut)
@router.patch("/projects/{project_id}", response_model=ProjectOut)
def update_admin_project(
    project_id: int,
    payload: StoreProjectRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
) -> dict:
    return project_service.update_project(db, payload.facultyId or 0, project_id, payload, current_user)


@router.patch("/projects/{project_id}/set-state", response_model=ProjectOut)
def update_project_state(
    project_id: int,
    payload: UpdateProjectStateRequest,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return project_service.update_project_state(db, project_id, payload.state)
