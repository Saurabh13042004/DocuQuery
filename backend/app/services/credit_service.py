from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestError, InsufficientCreditsError
from app.domain.enums import Operation, Plan
from app.domain.plans import COSTS, PLANS, SIGNUP_BONUS
from app.models import CreditTransaction, User
from app.repositories.users import CreditRepository


class CreditService:
    def __init__(self, db: Session, credits: CreditRepository):
        self.db = db
        self.credits = credits

    def check_and_deduct(self, user: User, operation: Operation) -> int:
        """Charge for *operation* (or raise 402) and return the remaining balance."""
        cost = COSTS[operation.value]
        if user.credits < cost:
            raise InsufficientCreditsError({
                "error": "insufficient_credits",
                "message": (
                    f"Not enough credits. '{operation.value}' costs {cost} credit(s) "
                    f"but you have {user.credits}."
                ),
                "credits_needed": cost,
                "credits_available": user.credits,
                "plan": user.plan,
            })
        return self.add_credits(user, -cost, operation.value)

    def refund(self, user: User, operation: Operation) -> int:
        """Give back what *operation* cost, e.g. when the work failed through no fault of the user."""
        return self.add_credits(user, COSTS[operation.value], f"{operation.value}_refund")

    def add_credits(self, user: User, amount: int, reason: str) -> int:
        user.credits += amount
        self.credits.add_transaction(user.id, amount, reason)
        self.db.commit()
        self.db.refresh(user)
        return user.credits

    def grant_signup_bonus(self, user: User) -> None:
        self.credits.add_transaction(user.id, SIGNUP_BONUS, "signup_bonus")
        self.db.commit()

    def change_plan(self, user: User, plan: Plan) -> User:
        # NOTE: no payment yet. Wire Stripe in front of this before charging real money.
        if plan.value == user.plan:
            raise BadRequestError("Already on this plan")
        user.plan = plan.value
        monthly = PLANS[plan.value]["monthly_credits"]
        if monthly > 0:
            user.credits += monthly
            self.credits.add_transaction(user.id, monthly, f"plan_upgrade_{plan.value}")
        else:
            # keep a trail of plan changes that grant no credits
            self.credits.add_transaction(user.id, 0, f"plan_switch_{plan.value}")
        self.db.commit()
        self.db.refresh(user)
        return user

    def history(self, user: User, limit: int = 50) -> list[CreditTransaction]:
        return self.credits.history(user.id, limit)

    @staticmethod
    def plans_overview(user: User) -> dict:
        return {"plans": PLANS, "current_plan": user.plan, "credits": user.credits, "costs": COSTS}
