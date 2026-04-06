import secrets
import shutil
import string
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import (
    Company,
    Expense,
    Faculty,
    Lecturer,
    Notification,
    ProjectCategory,
    ProjectType,
    Role,
    User,
)
from app.services.serializers import (
    company_to_dict,
    expense_to_dict,
    faculty_to_dict,
    lecturer_to_dict,
    notification_to_dict,
    project_category_to_dict,
    project_type_to_dict,
    user_to_dict,
)


def _not_found() -> None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=None)


def _save_company_file(file: UploadFile | None) -> str | None:
    if not file or not file.filename:
        return None

    suffix = Path(file.filename).suffix.lower()
    filename = f"{secrets.token_hex(16)}{suffix}"
    image_dir = settings.storage_public_path / "company_images"
    image_dir.mkdir(parents=True, exist_ok=True)
    target = image_dir / filename

    with target.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return f"company_images/{filename}"


def _delete_company_file(image_path: str | None) -> None:
    if not image_path:
        return
    storage_root = settings.storage_public_path.resolve()
    target = (settings.storage_public_path / image_path).resolve()
    if not target.is_relative_to(storage_root):
        return
    if target.exists() and target.is_file():
        target.unlink()


def list_companies(db: Session) -> list[dict]:
    return [company_to_dict(company) for company in db.scalars(select(Company)).all()]


def get_company(db: Session, company_id: int) -> dict:
    company = db.get(Company, company_id)
    if not company:
        _not_found()
    return company_to_dict(company)


def create_company(db: Session, company_name: str, file: UploadFile | None = None) -> dict:
    company = Company(name=company_name, image_path=_save_company_file(file))
    db.add(company)
    db.commit()
    db.refresh(company)
    return company_to_dict(company)


def update_company(db: Session, company_id: int, company_name: str, file: UploadFile | None = None) -> dict:
    company = db.get(Company, company_id)
    if not company:
        _not_found()

    new_image_path = _save_company_file(file)
    if new_image_path:
        _delete_company_file(company.image_path)
        company.image_path = new_image_path
    company.name = company_name
    db.commit()
    db.refresh(company)
    return company_to_dict(company)


def delete_company(db: Session, company_id: int) -> None:
    company = db.get(Company, company_id)
    if not company:
        _not_found()
    _delete_company_file(company.image_path)
    db.delete(company)
    db.commit()


def list_faculties(db: Session) -> list[dict]:
    return [faculty_to_dict(faculty) for faculty in db.scalars(select(Faculty)).all()]


def get_faculty(db: Session, faculty_id: int) -> dict:
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        _not_found()
    return faculty_to_dict(faculty)


def create_faculty(db: Session, name: str, price_for_course_per_day: int) -> dict:
    faculty = Faculty(name=name, price_for_course_per_day=price_for_course_per_day)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty_to_dict(faculty)


def update_faculty(db: Session, faculty_id: int, name: str, price_for_course_per_day: int) -> dict:
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        _not_found()
    faculty.name = name
    faculty.price_for_course_per_day = price_for_course_per_day
    db.commit()
    db.refresh(faculty)
    return faculty_to_dict(faculty)


def delete_faculty(db: Session, faculty_id: int) -> None:
    faculty = db.get(Faculty, faculty_id)
    if not faculty:
        _not_found()
    db.delete(faculty)
    db.commit()


def list_lecturers_by_faculty(db: Session, faculty_id: int) -> list[dict]:
    return [
        lecturer_to_dict(lecturer)
        for lecturer in db.scalars(select(Lecturer).where(Lecturer.faculty_id == faculty_id)).all()
    ]


def get_lecturer(db: Session, faculty_id: int, lecturer_id: int) -> dict:
    lecturer = db.get(Lecturer, lecturer_id)
    if not lecturer or lecturer.faculty_id != faculty_id:
        _not_found()
    return lecturer_to_dict(lecturer)


def create_lecturer(db: Session, faculty_id: int, name: str, hourly_rate: int, daily_rate: int) -> dict:
    if not db.get(Faculty, faculty_id):
        _not_found()
    lecturer = Lecturer(name=name, hourly_rate=hourly_rate, daily_rate=daily_rate, faculty_id=faculty_id)
    db.add(lecturer)
    db.commit()
    db.refresh(lecturer)
    return lecturer_to_dict(lecturer)


def update_lecturer(db: Session, faculty_id: int, lecturer_id: int, name: str, hourly_rate: int, daily_rate: int) -> dict:
    lecturer = db.get(Lecturer, lecturer_id)
    if not lecturer or lecturer.faculty_id != faculty_id:
        _not_found()
    lecturer.name = name
    lecturer.hourly_rate = hourly_rate
    lecturer.daily_rate = daily_rate
    db.commit()
    db.refresh(lecturer)
    return lecturer_to_dict(lecturer)


def delete_lecturer(db: Session, faculty_id: int, lecturer_id: int) -> None:
    lecturer = db.get(Lecturer, lecturer_id)
    if not lecturer or lecturer.faculty_id != faculty_id:
        _not_found()
    db.delete(lecturer)
    db.commit()


def list_faculty_users(db: Session) -> list[dict]:
    return [user_to_dict(user) for user in db.scalars(select(User).where(User.role == Role.FACULTY.value)).all()]


def get_user(db: Session, user_id: int) -> dict:
    user = db.get(User, user_id)
    if not user:
        _not_found()
    return user_to_dict(user)


def create_faculty_user(db: Session, email: str, faculty_id: int) -> dict:
    if not db.get(Faculty, faculty_id):
        _not_found()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The email has already been taken.")

    password = _generate_password()
    user = User(
        email=email,
        password=hash_password(password),
        role=Role.FACULTY.value,
        faculty_id=faculty_id,
        email_verified_at=datetime.now(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_dict(user, password=password)


def delete_user(db: Session, user_id: int) -> None:
    user = db.get(User, user_id)
    if not user:
        _not_found()
    db.delete(user)
    db.commit()


def _generate_password(length: int = 6) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _crud_list(db: Session, model, serializer) -> list[dict]:
    return [serializer(item) for item in db.scalars(select(model)).all()]


def _crud_get(db: Session, model, item_id: int, serializer) -> dict:
    item = db.get(model, item_id)
    if not item:
        _not_found()
    return serializer(item)


def _crud_delete(db: Session, model, item_id: int) -> None:
    item = db.get(model, item_id)
    if not item:
        _not_found()
    db.delete(item)
    db.commit()


def list_expenses(db: Session) -> list[dict]:
    return _crud_list(db, Expense, expense_to_dict)


def get_expense(db: Session, expense_id: int) -> dict:
    return _crud_get(db, Expense, expense_id, expense_to_dict)


def create_expense(db: Session, name: str) -> dict:
    expense = Expense(name=name)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense_to_dict(expense)


def update_expense(db: Session, expense_id: int, name: str) -> dict:
    expense = db.get(Expense, expense_id)
    if not expense:
        _not_found()
    expense.name = name
    db.commit()
    db.refresh(expense)
    return expense_to_dict(expense)


def delete_expense(db: Session, expense_id: int) -> None:
    _crud_delete(db, Expense, expense_id)


def list_project_types(db: Session) -> list[dict]:
    return _crud_list(db, ProjectType, project_type_to_dict)


def get_project_type(db: Session, project_type_id: int) -> dict:
    return _crud_get(db, ProjectType, project_type_id, project_type_to_dict)


def create_project_type(db: Session, name: str, code: str, is_course: bool) -> dict:
    project_type = ProjectType(name=name, code=code, is_course=is_course)
    db.add(project_type)
    db.commit()
    db.refresh(project_type)
    return project_type_to_dict(project_type)


def update_project_type(db: Session, project_type_id: int, name: str, code: str, is_course: bool) -> dict:
    project_type = db.get(ProjectType, project_type_id)
    if not project_type:
        _not_found()
    project_type.name = name
    project_type.code = code
    project_type.is_course = is_course
    db.commit()
    db.refresh(project_type)
    return project_type_to_dict(project_type)


def delete_project_type(db: Session, project_type_id: int) -> None:
    _crud_delete(db, ProjectType, project_type_id)


def list_project_categories(db: Session) -> list[dict]:
    return _crud_list(db, ProjectCategory, project_category_to_dict)


def get_project_category(db: Session, project_category_id: int) -> dict:
    return _crud_get(db, ProjectCategory, project_category_id, project_category_to_dict)


def create_project_category(db: Session, name: str) -> dict:
    project_category = ProjectCategory(name=name)
    db.add(project_category)
    db.commit()
    db.refresh(project_category)
    return project_category_to_dict(project_category)


def update_project_category(db: Session, project_category_id: int, name: str) -> dict:
    project_category = db.get(ProjectCategory, project_category_id)
    if not project_category:
        _not_found()
    project_category.name = name
    db.commit()
    db.refresh(project_category)
    return project_category_to_dict(project_category)


def delete_project_category(db: Session, project_category_id: int) -> None:
    _crud_delete(db, ProjectCategory, project_category_id)


def list_notifications(db: Session) -> list[dict]:
    return _crud_list(db, Notification, notification_to_dict)


def update_notification(db: Session, notification_id: int, email: str, activated: bool) -> dict:
    notification = db.get(Notification, notification_id)
    if not notification:
        _not_found()
    notification.email = email
    notification.activated = activated
    db.commit()
    db.refresh(notification)
    return notification_to_dict(notification)
