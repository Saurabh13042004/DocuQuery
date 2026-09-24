from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import Plan
from app.schemas.common import ORMModel


class UpgradePlanRequest(BaseModel):
    plan: Plan


class CreditTransactionResponse(ORMModel):
    id: int
    amount: int
    reason: str
    created_at: datetime


class PlanInfo(BaseModel):
    name: str
    price_usd: int
    monthly_credits: int
    badge_color: str
    description: str
    features: list[str]
    seats: int | None = None


class PlansResponse(BaseModel):
    plans: dict[str, PlanInfo]
    current_plan: str
    credits: int
    costs: dict[str, int]
