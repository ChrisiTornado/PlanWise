from datetime import date

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import ProjectState


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    password: str = Field(min_length=6)
    password_confirmation: str = Field(min_length=6)


class PasswordResetRequest(BaseModel):
    email: EmailStr


class VerifyTokenRequest(BaseModel):
    email: EmailStr
    token: str


class StoreCompanyRequest(BaseModel):
    companyName: str = Field(min_length=1, max_length=255)


class StoreExpenseRequest(BaseModel):
    name: str = Field(min_length=1)


class StoreFacultyRequest(BaseModel):
    name: str = Field(min_length=1)
    priceForCoursePerDay: int = Field(gt=0)


class StoreLecturerRequest(BaseModel):
    name: str = Field(min_length=1)
    hourlyRate: int
    dailyRate: int


class StoreProjectTypeRequest(BaseModel):
    name: str = Field(min_length=1)
    code: str = Field(min_length=1)
    isCourse: bool


class StoreProjectCategoryRequest(BaseModel):
    name: str = Field(min_length=1)


class StoreUserRequest(BaseModel):
    email: EmailStr
    faculty_id: int


class UpdateNotificationRequest(BaseModel):
    email: EmailStr
    activated: bool


class ProjectLecturerRequest(BaseModel):
    id: int
    hours: int
    daily: bool
    hourlyRateOverride: int | None = None
    dailyRateOverride: int | None = None


class ProjectExpenseRequest(BaseModel):
    id: int
    costs: int


class ProjectAdditionalExpenseRequest(BaseModel):
    id: int | None = None
    costs: int
    name: str
    perParticipant: bool


class ProjectFacultyRequest(BaseModel):
    id: int


class StoreProjectRequest(BaseModel):
    name: str
    costs: int
    projectTypeId: int
    companyId: int
    firstname: str
    lastname: str
    email: EmailStr
    start: date
    end: date
    crossFaculty: bool
    notes: str | None = None
    participants: int | None = None
    duration: int | None = None
    ects: int | None = None
    is_opened: bool | None = None
    priceForCoursePerDayOverride: int | None = None
    lecturers: list[ProjectLecturerRequest] = Field(default_factory=list)
    expenses: list[ProjectExpenseRequest] = Field(default_factory=list)
    otherExpenses: list[ProjectAdditionalExpenseRequest] = Field(default_factory=list)
    groupSpecificExpenses: list[ProjectAdditionalExpenseRequest] = Field(default_factory=list)
    crossFaculties: list[ProjectFacultyRequest] = Field(default_factory=list)
    projectId: int | None = None
    facultyId: int | None = None


class UpdateProjectStateRequest(BaseModel):
    state: ProjectState
