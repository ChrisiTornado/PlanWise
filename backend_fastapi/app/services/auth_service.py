import random
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import create_bearer_token, get_user_from_bearer_token, hash_password, verify_password
from app.models import PasswordReset, PersonalAccessToken, User
from app.services.serializers import user_login_to_dict, user_to_dict


def login_user(db: Session, email: str, password: str, bearer_token: str | None = None) -> dict:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Credentials incorrect")

    if bearer_token:
        token_user, _ = get_user_from_bearer_token(db, bearer_token)
        if not token_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalid")

    token = bearer_token or create_bearer_token(db, user)
    db.commit()
    return user_login_to_dict(user, token)


def logout_user(db: Session, access_token: PersonalAccessToken) -> dict[str, str]:
    db.delete(access_token)
    db.commit()
    return {"message": "Logged out"}


def change_user_password(db: Session, user: User, password: str, password_confirmation: str) -> dict:
    if password != password_confirmation:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password confirmation does not match")

    user.password = hash_password(password)
    user.password_reset = True
    db.commit()
    db.refresh(user)
    return user_to_dict(user)


def create_password_reset(db: Session, email: str) -> dict:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kein Benutzer mit dieser E-Mail vorhanden")

    token = str(random.randint(100000, 999999))
    db.add(PasswordReset(email=user.email, token=token, created_at=datetime.now()))
    db.commit()

    # Phase 4 keeps mail sending as a no-op placeholder. SMTP wiring follows after core API parity.
    return user_to_dict(user)


def verify_password_reset_token(db: Session, email: str, token: str) -> dict:
    password_reset = db.scalar(
        select(PasswordReset).where(PasswordReset.email == email, PasswordReset.token == token)
    )
    if not password_reset:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ungültiger Code")

    created_at = password_reset.created_at or datetime.now()
    if datetime.now() > created_at + timedelta(minutes=60):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dieser Token ist abgelaufen, fordern Sie einen neuen an",
        )

    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kein Benutzer mit dieser E-Mail vorhanden")

    db.execute(delete(PasswordReset).where(PasswordReset.email == email, PasswordReset.token == token))
    user.password_reset = False
    bearer_token = create_bearer_token(db, user)
    db.commit()
    db.refresh(user)
    return user_login_to_dict(user, bearer_token)
