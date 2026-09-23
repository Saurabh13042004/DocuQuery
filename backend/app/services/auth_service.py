import hashlib
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .. import models, schemas
from fastapi import HTTPException

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


RESET_TOKEN_EXPIRE_MINUTES = 30
MIN_PASSWORD_LENGTH = 8


def _password_fingerprint(hashed_password: str) -> str:
    # Ties a reset token to the password it was issued against, so it stops
    # working once the password changes (single use) without needing a DB table.
    return hashlib.sha256(hashed_password.encode("utf-8")).hexdigest()[:16]


def create_reset_token(user: models.User) -> str:
    # Deliberately has no "sub" claim: get_current_user requires one, so a reset
    # token can never be replayed as a login bearer token.
    payload = {
        "purpose": "password-reset",
        "email": user.email,
        "fp": _password_fingerprint(user.hashed_password),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def reset_password(db: Session, token: str, new_password: str) -> models.User:
    invalid = HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    try:
        payload = decode_token(token)
    except jwt.PyJWTError:
        raise invalid
    if payload.get("purpose") != "password-reset":
        raise invalid

    user = get_user_by_email(db, payload.get("email", ""))
    if not user or payload.get("fp") != _password_fingerprint(user.hashed_password):
        raise invalid
    if len(new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=422, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")

    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        created_at=datetime.now(timezone.utc),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> models.User | None:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
