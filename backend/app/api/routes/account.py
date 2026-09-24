from fastapi import APIRouter

from app.api.deps import CreditsDep, CurrentUser
from app.schemas.auth import UserResponse
from app.schemas.credits import CreditTransactionResponse, PlansResponse, UpgradePlanRequest

router = APIRouter(tags=["account"])


@router.get("/me", response_model=UserResponse)
def me(user: CurrentUser):
    return user


@router.get("/plans", response_model=PlansResponse)
def plans(user: CurrentUser, credits: CreditsDep):
    return credits.plans_overview(user)


@router.post("/upgrade-plan", response_model=UserResponse)
def upgrade_plan(body: UpgradePlanRequest, user: CurrentUser, credits: CreditsDep):
    return credits.change_plan(user, body.plan)


@router.get("/credits/history", response_model=list[CreditTransactionResponse])
def credit_history(user: CurrentUser, credits: CreditsDep):
    return credits.history(user)
