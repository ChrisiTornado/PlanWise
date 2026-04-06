from typing import Annotated

from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user_with_token
from app.db.session import get_db
from app.models import PersonalAccessToken, User
from app.schemas import ChangePasswordRequest, LoginRequest, PasswordResetRequest, UserLoginOut, UserOut, VerifyTokenRequest
from app.services import change_user_password, create_password_reset, login_user, logout_user, verify_password_reset_token

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=UserLoginOut)
def login(
    payload: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    bearer_token = authorization.split(" ", 1)[1] if authorization and authorization.lower().startswith("bearer ") else None
    return login_user(db, payload.email, payload.password, bearer_token)


@router.post("/logout")
def logout(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[tuple[User, PersonalAccessToken], Depends(get_current_user_with_token)],
) -> dict[str, str]:
    _, access_token = current
    return logout_user(db, access_token)


@router.put("/change-password", response_model=UserOut)
def change_password(
    payload: ChangePasswordRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[tuple[User, PersonalAccessToken], Depends(get_current_user_with_token)],
) -> dict:
    user, _ = current
    return change_user_password(db, user, payload.password, payload.password_confirmation)


@router.post("/password-reset", response_model=UserOut)
def password_reset(payload: PasswordResetRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return create_password_reset(db, payload.email)


@router.post("/verify-token", response_model=UserLoginOut)
def verify_token(payload: VerifyTokenRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    return verify_password_reset_token(db, payload.email, payload.token)
