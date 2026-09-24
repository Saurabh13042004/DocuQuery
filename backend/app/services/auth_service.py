from __future__ import annotations

import jwt
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import Settings
from app.core.exceptions import BadRequestError, UnauthorizedError
from app.domain.plans import SIGNUP_BONUS
from app.models import User
from app.ports import PasswordResetMessage
from app.repositories.users import UserRepository
from app.schemas.auth import SignupRequest
from app.services.credit_service import CreditService
from app.utils.time import utcnow


class AuthService:
    def __init__(self, db: Session, users: UserRepository, credits: CreditService, settings: Settings):
        self.db = db
        self.users = users
        self.credits = credits
        self.settings = settings

    # -- sign up / log in ----------------------------------------------------
    def signup(self, data: SignupRequest) -> tuple[User, str]:
        if self.users.get_by_email(data.email):
            raise BadRequestError("Email already registered")
        user = self.users.add(User(
            name=data.name, email=data.email, hashed_password=security.hash_password(data.password),
            created_at=utcnow(), credits=SIGNUP_BONUS,
        ))
        self.db.commit()
        self.credits.grant_signup_bonus(user)
        self.db.refresh(user)
        return user, self._access_token(user)

    def login(self, email: str, password: str) -> tuple[User, str]:
        user = self.users.get_by_email(email)
        if not user or not security.verify_password(password, user.hashed_password or ""):
            raise UnauthorizedError("Incorrect email or password")
        return user, self._access_token(user)

    def user_from_token(self, token: str) -> User:
        try:
            payload = security.decode_token(token, self.settings.secret_key)
        except jwt.ExpiredSignatureError:
            raise UnauthorizedError("Token expired")
        except jwt.PyJWTError:
            raise UnauthorizedError("Invalid token")
        email = payload.get("sub")
        if not email:  # e.g. a password-reset token, which must never work as a login
            raise UnauthorizedError("Invalid token")
        user = self.users.get_by_email(email)
        if not user:
            raise UnauthorizedError("User not found")
        return user

    def _access_token(self, user: User) -> str:
        return security.create_access_token(user.email, self.settings.secret_key, self.settings.access_token_minutes)

    # -- password reset --------------------------------------------------------
    def start_password_reset(self, email: str) -> PasswordResetMessage | None:
        """Returns the email to send, or None when there is nothing to send.

        Callers respond identically either way so this can't be used to find out who has an account.
        """
        user = self.users.get_by_email(email)
        if not user or not user.is_active:
            return None
        token = security.create_reset_token(
            user.email, user.hashed_password, self.settings.secret_key, self.settings.reset_token_minutes)
        return PasswordResetMessage(user.email, user.name, token, self.settings.reset_token_minutes)

    def reset_password(self, token: str, new_password: str) -> None:
        invalid = BadRequestError("This reset link is invalid or has expired.")
        try:
            payload = security.decode_token(token, self.settings.secret_key)
        except jwt.PyJWTError:
            raise invalid
        if payload.get("purpose") != security.RESET_PURPOSE:
            raise invalid
        user = self.users.get_by_email(payload.get("email", ""))
        if not user or payload.get("fp") != security.password_fingerprint(user.hashed_password):
            raise invalid
        user.hashed_password = security.hash_password(new_password)
        self.db.commit()
