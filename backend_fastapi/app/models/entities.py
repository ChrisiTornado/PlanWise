from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class Faculty(TimestampMixin, Base):
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price_for_course_per_day: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    users: Mapped[list["User"]] = relationship(back_populates="faculty")
    lecturers: Mapped[list["Lecturer"]] = relationship(back_populates="faculty", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship(back_populates="faculty")


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    remember_token: Mapped[str | None] = mapped_column(String(100), nullable=True)
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey("faculties.id", ondelete="SET NULL"), nullable=True)
    password_reset: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    faculty: Mapped[Faculty | None] = relationship(back_populates="users")
    projects: Mapped[list["Project"]] = relationship(back_populates="user")


class Lecturer(TimestampMixin, Base):
    __tablename__ = "lecturers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hourly_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    daily_rate: Mapped[int] = mapped_column(Integer, nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)

    faculty: Mapped[Faculty] = relationship(back_populates="lecturers")
    projects: Mapped[list["ProjectLecturer"]] = relationship(back_populates="lecturer", cascade="all, delete-orphan")


class Expense(TimestampMixin, Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    projects: Mapped[list["ProjectExpense"]] = relationship(back_populates="expense", cascade="all, delete-orphan")


class ProjectType(TimestampMixin, Base):
    __tablename__ = "project_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(255), nullable=False)
    is_course: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    projects: Mapped[list["Project"]] = relationship(back_populates="project_type")


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)

    projects: Mapped[list["Project"]] = relationship(back_populates="company")


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    costs: Mapped[int] = mapped_column(Integer, nullable=False)
    project_type_id: Mapped[int] = mapped_column(ForeignKey("project_types.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="CASCADE"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    firstname: Mapped[str] = mapped_column(String(255), nullable=False)
    lastname: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    start: Mapped[date] = mapped_column(Date, nullable=False)
    end: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    cross_faculty: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ects: Mapped[int | None] = mapped_column(Integer, nullable=True)
    contribution_margin_1: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    contribution_margin_2: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    is_opened: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    price_for_course_per_day_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="submitted")
    state_changed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    project_type: Mapped[ProjectType] = relationship(back_populates="projects")
    company: Mapped[Company] = relationship(back_populates="projects")
    user: Mapped[User] = relationship(back_populates="projects")
    faculty: Mapped[Faculty] = relationship(back_populates="projects")
    lecturers: Mapped[list["ProjectLecturer"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    expenses: Mapped[list["ProjectExpense"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    faculties: Mapped[list["ProjectFaculty"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    other_expenses: Mapped[list["OtherExpense"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    group_specific_expenses: Mapped[list["GroupSpecificExpense"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectLecturer(TimestampMixin, Base):
    __tablename__ = "project_lecturer"

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    lecturer_id: Mapped[int] = mapped_column(ForeignKey("lecturers.id", ondelete="CASCADE"), primary_key=True)
    hours: Mapped[int] = mapped_column(Integer, nullable=False)
    daily: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    hourly_rate_override: Mapped[int | None] = mapped_column(Integer, nullable=True)
    daily_rate_override: Mapped[int | None] = mapped_column(Integer, nullable=True)

    project: Mapped[Project] = relationship(back_populates="lecturers")
    lecturer: Mapped[Lecturer] = relationship(back_populates="projects")


class ProjectExpense(TimestampMixin, Base):
    __tablename__ = "project_expense"

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), primary_key=True)
    costs: Mapped[int] = mapped_column(Integer, nullable=False)

    project: Mapped[Project] = relationship(back_populates="expenses")
    expense: Mapped[Expense] = relationship(back_populates="projects")


class ProjectFaculty(TimestampMixin, Base):
    __tablename__ = "project_faculty"

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculties.id", ondelete="CASCADE"), primary_key=True)

    project: Mapped[Project] = relationship(back_populates="faculties")
    faculty: Mapped[Faculty] = relationship()


class OtherExpense(TimestampMixin, Base):
    __tablename__ = "other_expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    costs: Mapped[int] = mapped_column(Integer, nullable=False)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    per_participant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    project: Mapped[Project] = relationship(back_populates="other_expenses")


class GroupSpecificExpense(TimestampMixin, Base):
    __tablename__ = "group_specific_expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    costs: Mapped[int] = mapped_column(Integer, nullable=False)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    per_participant: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    project: Mapped[Project] = relationship(back_populates="group_specific_expenses")


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    activated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class ProjectCategory(TimestampMixin, Base):
    __tablename__ = "project_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    token: Mapped[str] = mapped_column(String(255), primary_key=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    email: Mapped[str] = mapped_column(String(255), primary_key=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class PersonalAccessToken(TimestampMixin, Base):
    __tablename__ = "personal_access_tokens"
    __table_args__ = (UniqueConstraint("token", name="uq_personal_access_tokens_token"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    tokenable_type: Mapped[str] = mapped_column(String(255), nullable=False)
    tokenable_id: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    token: Mapped[str] = mapped_column(String(64), nullable=False)
    abilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class FailedJob(Base):
    __tablename__ = "failed_jobs"
    __table_args__ = (UniqueConstraint("uuid", name="uq_failed_jobs_uuid"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[str] = mapped_column(String(255), nullable=False)
    connection: Mapped[str] = mapped_column(Text, nullable=False)
    queue: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    exception: Mapped[str] = mapped_column(Text, nullable=False)
    failed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
