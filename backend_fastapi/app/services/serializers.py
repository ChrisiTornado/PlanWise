from app.core.config import settings
from app.models import (
    Company,
    Expense,
    Faculty,
    GroupSpecificExpense,
    Lecturer,
    Notification,
    OtherExpense,
    Project,
    ProjectCategory,
    ProjectExpense,
    ProjectLecturer,
    ProjectType,
    User,
)


def cents_to_euros(value: int | None) -> float | None:
    return None if value is None else value / 100


def company_to_dict(company: Company) -> dict:
    return {
        "id": company.id,
        "name": company.name,
        "image_url": f"{settings.api_base_url}/storage/{company.image_path}" if company.image_path else None,
    }


def expense_to_dict(expense: Expense) -> dict:
    return {"id": expense.id, "name": expense.name}


def faculty_to_dict(faculty: Faculty) -> dict:
    return {
        "id": faculty.id,
        "name": faculty.name,
        "priceForCoursePerDay": cents_to_euros(faculty.price_for_course_per_day),
    }


def lecturer_to_dict(lecturer: Lecturer) -> dict:
    return {
        "id": lecturer.id,
        "name": lecturer.name,
        "hourlyRate": cents_to_euros(lecturer.hourly_rate),
        "dailyRate": cents_to_euros(lecturer.daily_rate),
        "faculty": faculty_to_dict(lecturer.faculty),
    }


def notification_to_dict(notification: Notification) -> dict:
    return {
        "id": notification.id,
        "email": notification.email,
        "activated": notification.activated,
    }


def project_type_to_dict(project_type: ProjectType) -> dict:
    return {
        "id": project_type.id,
        "name": project_type.name,
        "code": project_type.code,
        "isCourse": project_type.is_course,
    }


def project_category_to_dict(project_category: ProjectCategory) -> dict:
    return {"id": project_category.id, "name": project_category.name}


def user_to_dict(user: User, password: str | None = None) -> dict:
    payload = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "verified": user.email_verified_at is not None,
        "passwordReset": user.password_reset,
        "faculty": faculty_to_dict(user.faculty) if user.faculty else None,
    }
    if password:
        payload["password"] = password
    return payload


def user_login_to_dict(user: User, token: str) -> dict:
    return {**user_to_dict(user), "token": token}


def project_lecturer_to_dict(project_lecturer: ProjectLecturer) -> dict:
    return {
        "projectId": project_lecturer.project_id,
        "lecturer": lecturer_to_dict(project_lecturer.lecturer),
        "hours": project_lecturer.hours,
        "daily": project_lecturer.daily,
        "hourlyRateOverride": cents_to_euros(project_lecturer.hourly_rate_override),
        "dailyRateOverride": cents_to_euros(project_lecturer.daily_rate_override),
    }


def project_expense_to_dict(project_expense: ProjectExpense) -> dict:
    return {
        "projectId": project_expense.project_id,
        "expense": expense_to_dict(project_expense.expense),
        "costs": cents_to_euros(project_expense.costs),
    }


def other_expense_to_dict(other_expense: OtherExpense | GroupSpecificExpense) -> dict:
    return {
        "id": other_expense.id,
        "name": other_expense.name,
        "costs": cents_to_euros(other_expense.costs),
        "perParticipant": other_expense.per_participant,
    }


def project_to_dict(project: Project, is_admin: bool) -> dict:
    costs = project.costs if is_admin else get_faculty_visible_costs(project)
    return {
        "id": project.id,
        "name": project.name,
        "costs": cents_to_euros(costs),
        "firstname": project.firstname,
        "lastname": project.lastname,
        "email": project.email,
        "start": project.start.isoformat(),
        "end": project.end.isoformat(),
        "notes": project.notes,
        "participants": project.participants,
        "duration": project.duration,
        "ects": project.ects,
        "crossFaculty": project.cross_faculty,
        "userId": project.user.id,
        "isOpened": project.is_opened,
        "faculty": faculty_to_dict(project.faculty),
        "projectType": project_type_to_dict(project.project_type),
        "company": company_to_dict(project.company),
        "state": project.state,
        "stateChangedAt": project.state_changed_at.strftime("%Y-%m-%d %H:%M:%S") if project.state_changed_at else None,
        "createdAt": project.created_at.strftime("%Y-%m-%d %H:%M:%S") if project.created_at else None,
        "lecturers": [project_lecturer_to_dict(item) for item in project.lecturers],
        "expenses": [project_expense_to_dict(item) for item in project.expenses],
        "crossFaculties": [faculty_to_dict(item.faculty) for item in project.faculties],
        "priceForCoursePerDayOverride": cents_to_euros(project.price_for_course_per_day_override),
        "otherExpenses": [other_expense_to_dict(item) for item in project.other_expenses] if is_admin else [],
        "groupSpecificExpenses": [other_expense_to_dict(item) for item in project.group_specific_expenses] if is_admin else [],
    }


def get_faculty_visible_costs(project: Project) -> int:
    lecturer_costs = 0
    for project_lecturer in project.lecturers:
        if project_lecturer.daily:
            rate = project_lecturer.daily_rate_override or project_lecturer.lecturer.daily_rate
        else:
            rate = project_lecturer.hourly_rate_override or project_lecturer.lecturer.hourly_rate
        lecturer_costs += project_lecturer.hours * rate

    return lecturer_costs + sum(project_expense.costs for project_expense in project.expenses)
