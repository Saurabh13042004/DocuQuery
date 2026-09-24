"""Password hashing and signed tokens. Pure functions, no database and no HTTP."""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

ALGORITHM = "HS256"
BCRYPT_ROUNDS = 12  # tests lower this; the cost only matters for real password hashes
RESET_PURPOSE = "password-reset"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:  # malformed stored hash
        return False


def _encode(payload: dict, secret: str, minutes: int) -> str:
    payload = {**payload, "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes)}
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def decode_token(token: str, secret: str) -> dict:
    """Raises jwt.PyJWTError (including ExpiredSignatureError) for anything invalid."""
    return jwt.decode(token, secret, algorithms=[ALGORITHM])


def create_access_token(subject: str, secret: str, minutes: int) -> str:
    return _encode({"sub": subject}, secret, minutes)


def password_fingerprint(hashed_password: str) -> str:
    """Ties a reset token to the password it was issued against, so it stops working once used."""
    return hashlib.sha256(hashed_password.encode("utf-8")).hexdigest()[:16]


def create_reset_token(email: str, hashed_password: str, secret: str, minutes: int) -> str:
    # No "sub" claim on purpose: access-token checks require one, so a reset token can never
    # be replayed as a login bearer token.
    return _encode(
        {"purpose": RESET_PURPOSE, "email": email, "fp": password_fingerprint(hashed_password)},
        secret,
        minutes,
    )
