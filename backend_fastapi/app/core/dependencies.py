from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_user_from_bearer_token
from app.db.session import get_db
from app.models import PersonalAccessToken, Role, User


def get_current_user_with_token(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> tuple[User, PersonalAccessToken]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthenticated.")

    bearer_token = authorization.split(" ", 1)[1]
    user, access_token = get_user_from_bearer_token(db, bearer_token)
    if not user or not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthenticated.")

    return user, access_token


def get_current_user(
    current: Annotated[tuple[User, PersonalAccessToken], Depends(get_current_user_with_token)],
) -> User:
    return current[0]


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != Role.ADMIN.value:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=None)
    return current_user


def require_faculty_access(faculty_id: int, current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role == Role.ADMIN.value:
        return current_user

    if current_user.faculty_id != faculty_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=None)

    return current_user
