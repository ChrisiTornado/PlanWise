from datetime import datetime
from typing import Iterable

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Company,
    Expense,
    Faculty,
    GroupSpecificExpense,
    Lecturer,
    OtherExpense,
    Project,
    ProjectExpense,
    ProjectFaculty,
    ProjectLecturer,
    ProjectState,
    ProjectType,
    Role,
    User,
)
from app.schemas import StoreProjectRequest
from app.services.serializers import project_to_dict


def _not_found(detail: str | None = None) -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _validation_error(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


def _deduplicate(items: Iterable, key: str = "id") -> list:
    unique = {}
    for item in items or []:
        item_key = getattr(item, key)
        if item_key is not None:
            unique[item_key] = item
    return list(unique.values())


def _get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if not project:
        _not_found("No projects found")
    return project


def _assert_exists(db: Session, model, item_id: int) -> None:
    if not db.get(model, item_id):
        _validation_error(f"{model.__tablename__} entry does not exist.")


def _validate_payload(db: Session, faculty_id: int, payload: StoreProjectRequest, is_update: bool = False) -> ProjectType:
    _assert_exists(db, Faculty, faculty_id)
    _assert_exists(db, Company, payload.companyId)
    project_type = db.get(ProjectType, payload.projectTypeId)
    if not project_type:
        _validation_error("projectTypeId does not exist.")

    if project_type.is_course:
        if not payload.participants or payload.participants < 1:
            _validation_error("participants is required for course projects.")
        if not payload.duration or payload.duration < 1:
            _validation_error("duration is required for course projects.")
        if is_update and (not payload.ects or payload.ects < 1):
            _validation_error("ects is required for course projects.")

    for lecturer in _deduplicate(payload.lecturers):
        _assert_exists(db, Lecturer, lecturer.id)
    for expense in _deduplicate(payload.expenses):
        _assert_exists(db, Expense, expense.id)
    for faculty in _deduplicate(payload.crossFaculties):
        _assert_exists(db, Faculty, faculty.id)

    return project_type


def _is_admin(user: User) -> bool:
    return user.role == Role.ADMIN.value


def list_admin_projects(db: Session, user: User) -> list[dict]:
    return [project_to_dict(project, is_admin=True) for project in db.scalars(select(Project)).all()]


def list_faculty_projects(db: Session, faculty_id: int, user: User) -> list[dict]:
    return [
        project_to_dict(project, is_admin=_is_admin(user))
        for project in db.scalars(select(Project).where(Project.faculty_id == faculty_id)).all()
    ]


def get_admin_project(db: Session, project_id: int) -> dict:
    project = _get_project(db, project_id)
    if not project.is_opened:
        project.is_opened = True
        db.commit()
        db.refresh(project)
    return project_to_dict(project, is_admin=True)


def get_faculty_project(db: Session, faculty_id: int, project_id: int, user: User) -> dict:
    project = _get_project(db, project_id)
    if project.faculty_id != faculty_id:
        _not_found("No projects found")
    return project_to_dict(project, is_admin=_is_admin(user))


def get_projects_by_company_id(db: Session, company_id: int) -> list[dict]:
    if not db.get(Company, company_id):
        return []
    return [
        project_to_dict(project, is_admin=True)
        for project in db.scalars(select(Project).where(Project.company_id == company_id)).all()
    ]


def get_projects_by_faculty_id(db: Session, faculty_id: int) -> list[dict]:
    if not db.get(Faculty, faculty_id):
        return []
    return [
        project_to_dict(project, is_admin=True)
        for project in db.scalars(select(Project).where(Project.faculty_id == faculty_id)).all()
    ]


def create_faculty_project(db: Session, faculty_id: int, payload: StoreProjectRequest, user: User) -> dict:
    _validate_payload(db, faculty_id, payload, is_update=False)

    project = Project(
        name=payload.name,
        costs=payload.costs,
        firstname=payload.firstname,
        lastname=payload.lastname,
        email=str(payload.email),
        start=payload.start,
        end=payload.end,
        cross_faculty=payload.crossFaculty,
        notes=payload.notes,
        participants=payload.participants,
        duration=payload.duration,
        ects=payload.ects,
        is_opened=payload.is_opened or False,
        project_type_id=payload.projectTypeId,
        company_id=payload.companyId,
        user_id=user.id,
        faculty_id=faculty_id,
    )
    db.add(project)
    db.flush()

    _replace_lecturers(project, payload)
    _replace_expenses(project, payload)
    _replace_cross_faculties(project, payload)
    db.commit()
    db.refresh(project)
    return project_to_dict(project, is_admin=_is_admin(user))


def update_project(db: Session, faculty_id: int, project_id: int, payload: StoreProjectRequest, user: User) -> dict:
    _validate_payload(db, faculty_id, payload, is_update=True)
    project = _get_project(db, project_id)
    if project.faculty_id != faculty_id:
        _not_found("No projects found")

    project.name = payload.name
    project.costs = payload.costs
    project.firstname = payload.firstname
    project.lastname = payload.lastname
    project.email = str(payload.email)
    project.start = payload.start
    project.end = payload.end
    project.cross_faculty = payload.crossFaculty
    project.notes = payload.notes
    project.participants = payload.participants
    project.duration = payload.duration
    project.ects = payload.ects
    project.project_type_id = payload.projectTypeId
    project.company_id = payload.companyId
    project.price_for_course_per_day_override = payload.priceForCoursePerDayOverride

    _replace_lecturers(project, payload)
    _replace_expenses(project, payload)
    _replace_cross_faculties(project, payload)

    if _is_admin(user):
        _replace_additional_expenses(project, OtherExpense, payload.otherExpenses)
        _replace_additional_expenses(project, GroupSpecificExpense, payload.groupSpecificExpenses)

    db.commit()
    db.refresh(project)
    return project_to_dict(project, is_admin=_is_admin(user))


def update_project_state(db: Session, project_id: int, state_value: ProjectState) -> dict:
    project = _get_project(db, project_id)
    project.state = state_value.value
    project.state_changed_at = datetime.now()
    db.commit()
    db.refresh(project)
    return project_to_dict(project, is_admin=True)


def get_projects_for_report(db: Session, ids: list[int], user: User) -> list[Project]:
    if not ids:
        _not_found()

    projects = db.scalars(select(Project).where(Project.id.in_(ids))).all()
    if not projects:
        _not_found()

    if user.role == Role.FACULTY.value:
        for project in projects:
            if project.faculty_id != user.faculty_id:
                raise HTTPException(status_code=status.HTTP_405_METHOD_NOT_ALLOWED, detail=None)

    return projects


def _replace_lecturers(project: Project, payload: StoreProjectRequest) -> None:
    project.lecturers.clear()
    for lecturer in _deduplicate(payload.lecturers):
        project.lecturers.append(
            ProjectLecturer(
                lecturer_id=lecturer.id,
                hours=lecturer.hours,
                daily=lecturer.daily,
                hourly_rate_override=lecturer.hourlyRateOverride,
                daily_rate_override=lecturer.dailyRateOverride,
            )
        )


def _replace_expenses(project: Project, payload: StoreProjectRequest) -> None:
    project.expenses.clear()
    for expense in _deduplicate(payload.expenses):
        project.expenses.append(ProjectExpense(expense_id=expense.id, costs=expense.costs))


def _replace_cross_faculties(project: Project, payload: StoreProjectRequest) -> None:
    project.faculties.clear()
    for faculty in _deduplicate(payload.crossFaculties):
        project.faculties.append(ProjectFaculty(faculty_id=faculty.id))


def _replace_additional_expenses(project: Project, model, items: list) -> None:
    target = project.other_expenses if model is OtherExpense else project.group_specific_expenses
    target.clear()
    for item in items or []:
        target.append(model(name=item.name, costs=item.costs, per_participant=item.perParticipant))
