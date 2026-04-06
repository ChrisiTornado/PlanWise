import hashlib
import secrets
from datetime import datetime

import bcrypt
from sqlalchemy.orm import Session

from app.models import PersonalAccessToken, User


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    normalized_hash = password_hash
    if normalized_hash.startswith("$2y$"):
        normalized_hash = "$2b$" + normalized_hash[4:]

    return bcrypt.checkpw(password.encode("utf-8"), normalized_hash.encode("utf-8"))


def _hash_token(plain_token: str) -> str:
    return hashlib.sha256(plain_token.encode("utf-8")).hexdigest()


def create_bearer_token(db: Session, user: User, name: str = "token") -> str:
    plain_token = secrets.token_hex(32)
    access_token = PersonalAccessToken(
        tokenable_type="App\\Models\\User",
        tokenable_id=user.id,
        name=name,
        token=_hash_token(plain_token),
        abilities=f'["{user.role}"]',
    )
    db.add(access_token)
    db.flush()
    return f"{access_token.id}|{plain_token}"


def get_user_from_bearer_token(db: Session, bearer_token: str | None) -> tuple[User | None, PersonalAccessToken | None]:
    if not bearer_token or "|" not in bearer_token:
        return None, None

    token_id, plain_token = bearer_token.split("|", 1)
    if not token_id.isdigit() or not plain_token:
        return None, None

    access_token = db.get(PersonalAccessToken, int(token_id))
    if not access_token or access_token.token != _hash_token(plain_token):
        return None, None

    if access_token.tokenable_type != "App\\Models\\User":
        return None, None

    user = db.get(User, access_token.tokenable_id)
    if not user:
        return None, None

    access_token.last_used_at = datetime.now()
    db.flush()
    return user, access_token
