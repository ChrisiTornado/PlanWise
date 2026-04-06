from enum import StrEnum


class Role(StrEnum):
    ADMIN = "admin"
    FACULTY = "faculty"
    CUSTOMER = "customer"


class ProjectState(StrEnum):
    APPROVED = "approved"
    SUBMITTED = "submitted"
    REJECTED = "rejected"
