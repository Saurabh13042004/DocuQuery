from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from .. import models

SIGNUP_BONUS = 20

# credits consumed per operation
COSTS = {
    "upload": 2,
    "ask": 1,
    "edit": 2,
}

PLANS: dict = {
    "free": {
        "name": "Free",
        "price_usd": 0,
        "monthly_credits": 0,
        "badge_color": "secondary",
        "description": "Perfect for getting started",
        "features": [
            f"{SIGNUP_BONUS} one-time credits (try it free)",
            "PDF Q&A (1 credit)",
            "PDF editing (2 credits)",
            "Upload PDFs (2 credits)",
            "Community support",
        ],
    },
    "starter": {
        "name": "Starter",
        "price_usd": 9,
        "monthly_credits": 500,
        "badge_color": "default",
        "description": "For individuals & small teams",
        "features": [
            "500 credits / month",
            "PDF Q&A (1 credit)",
            "PDF editing (2 credits)",
            "Upload PDFs (2 credits)",
            "Email support",
        ],
    },
    "pro": {
        "name": "Pro",
        "price_usd": 29,
        "monthly_credits": 2000,
        "badge_color": "default",
        "description": "For power users & growing teams",
        "features": [
            "2 000 credits / month",
            "PDF Q&A (1 credit)",
            "PDF editing (2 credits)",
            "Upload PDFs (2 credits)",
            "Priority support",
            "API access",
        ],
    },
    "team": {
        "name": "Team",
        "price_usd": 79,
        "monthly_credits": 1500,
        "seats": 5,
        "badge_color": "default",
        "description": "For teams collaborating on documents",
        "features": [
            "5 seats, 1 500 credits / seat",
            "Shared document library",
            "Roles: Admin / Editor / Viewer",
            "Team usage dashboard",
            "Shared prompts & comments",
        ],
    },
}


def _log(db: Session, user_id: int, amount: int, reason: str):
    db.add(models.CreditTransaction(
        user_id=user_id,
        amount=amount,
        reason=reason,
        created_at=datetime.now(timezone.utc),
    ))


def check_and_deduct(db: Session, user: models.User, operation: str) -> int:
    """Verify the user can afford *operation*, deduct credits, persist, return remaining."""
    cost = COSTS.get(operation, 1)
    if user.credits < cost:
        raise HTTPException(
            status_code=402,
            detail={
                "error": "insufficient_credits",
                "message": (
                    f"Not enough credits. '{operation}' costs {cost} credit(s) "
                    f"but you have {user.credits}."
                ),
                "credits_needed": cost,
                "credits_available": user.credits,
                "plan": user.plan,
            },
        )
    user.credits -= cost
    _log(db, user.id, -cost, operation)
    db.commit()
    db.refresh(user)
    return user.credits


def add_credits(db: Session, user: models.User, amount: int, reason: str) -> int:
    """Add *amount* credits to *user* and log the transaction."""
    user.credits += amount
    _log(db, user.id, amount, reason)
    db.commit()
    db.refresh(user)
    return user.credits


def grant_signup_bonus(db: Session, user: models.User):
    """Called once at registration."""
    # credits=50 is already the column default; just log it
    _log(db, user.id, SIGNUP_BONUS, "signup_bonus")
    db.commit()


def upgrade_plan(db: Session, user: models.User, new_plan: str) -> models.User:
    if new_plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Unknown plan '{new_plan}'")
    if new_plan == user.plan:
        raise HTTPException(status_code=400, detail="Already on this plan")

    plan_info = PLANS[new_plan]
    user.plan = new_plan
    monthly = plan_info["monthly_credits"]
    if monthly > 0:
        user.credits += monthly
        _log(db, user.id, monthly, f"plan_upgrade_{new_plan}")
    db.commit()
    db.refresh(user)
    return user
