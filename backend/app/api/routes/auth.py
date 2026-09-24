from fastapi import APIRouter, BackgroundTasks

from app.api.deps import AuthDep, MailerDep
from app.schemas.auth import (
    ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, SignupRequest, TokenResponse, UserResponse,
)
from app.schemas.common import MessageOut

router = APIRouter(tags=["auth"])


def _token(user, token: str) -> TokenResponse:
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupRequest, auth: AuthDep):
    return _token(*auth.signup(body))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, auth: AuthDep):
    return _token(*auth.login(body.email, body.password))


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(body: ForgotPasswordRequest, background: BackgroundTasks, auth: AuthDep, mailer: MailerDep):
    # Same response whether or not the account exists; the email goes out after the response.
    message = auth.start_password_reset(body.email)
    if message:
        background.add_task(mailer.send_password_reset, message)
    return {"message": "If an account exists for that email, a reset link is on its way."}


@router.post("/reset-password", response_model=MessageOut)
def reset_password(body: ResetPasswordRequest, auth: AuthDep):
    auth.reset_password(body.token, body.password)
    return {"message": "Password updated. You can sign in with your new password."}
