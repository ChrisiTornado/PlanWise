from datetime import date, datetime
from typing import Any

from app.models.enums import ProjectState, Role
from app.schemas.common import ApiSchema


class CompanyOut(ApiSchema):
    id: int
    name: str
    image_url: str | None = None


class ExpenseOut(ApiSchema):
    id: int
    name: str


class FacultyOut(ApiSchema):
    id: int
    name: str
    priceForCoursePerDay: float


class LecturerOut(ApiSchema):
    id: int
    name: str
    hourlyRate: float
    dailyRate: float
    faculty: FacultyOut


class NotificationOut(ApiSchema):
    id: int
    email: str
    activated: bool


class ProjectTypeOut(ApiSchema):
    id: int
    name: str
    code: str
    isCourse: bool


class ProjectCategoryOut(ApiSchema):
    id: int
    name: str


class UserOut(ApiSchema):
    id: int
    email: str
    role: Role | str
    verified: bool
    passwordReset: bool
    faculty: FacultyOut | None = None
    password: str | None = None


class UserLoginOut(UserOut):
    token: str


class ProjectLecturerOut(ApiSchema):
    projectId: int
    lecturer: LecturerOut
    hours: int
    daily: bool
    hourlyRateOverride: float | None = None
    dailyRateOverride: float | None = None


class ProjectExpenseOut(ApiSchema):
    projectId: int
    expense: ExpenseOut
    costs: float


class OtherExpenseOut(ApiSchema):
    id: int
    name: str
    costs: float
    perParticipant: bool


class GroupSpecificExpenseOut(ApiSchema):
    id: int
    name: str
    costs: float
    perParticipant: bool


class ProjectOut(ApiSchema):
    id: int
    name: str
    costs: float
    firstname: str
    lastname: str
    email: str
    start: date | str
    end: date | str
    notes: str | None
    participants: int | None
    duration: int | None
    ects: int | None
    crossFaculty: bool
    userId: int
    isOpened: bool
    faculty: FacultyOut
    projectType: ProjectTypeOut
    company: CompanyOut
    state: ProjectState | str
    stateChangedAt: datetime | str | None
    createdAt: datetime | str | None
    lecturers: list[ProjectLecturerOut]
    expenses: list[ProjectExpenseOut]
    crossFaculties: list[FacultyOut]
    priceForCoursePerDayOverride: float | None
    otherExpenses: list[OtherExpenseOut]
    groupSpecificExpenses: list[GroupSpecificExpenseOut]


class CsvExportOut(ApiSchema):
    csv_string: str


JsonDict = dict[str, Any]
