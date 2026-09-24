"""Plan catalog and credit prices. Data only; the rules live in CreditService."""
from app.domain.enums import Operation, Plan

SIGNUP_BONUS = 20
TEAM_SEATS = 5
TEAM_SEAT_CREDITS = 1500

COSTS: dict[str, int] = {
    Operation.UPLOAD.value: 2,
    Operation.ASK.value: 1,
    Operation.EDIT.value: 2,
}

_COMMON = ["PDF Q&A (1 credit)", "PDF editing (2 credits)", "Upload PDFs (2 credits)"]

PLANS: dict[str, dict] = {
    Plan.FREE.value: {
        "name": "Free",
        "price_usd": 0,
        "monthly_credits": 0,
        "badge_color": "secondary",
        "description": "Perfect for getting started",
        "features": [f"{SIGNUP_BONUS} one-time credits (try it free)", *_COMMON, "Community support"],
    },
    Plan.STARTER.value: {
        "name": "Starter",
        "price_usd": 9,
        "monthly_credits": 500,
        "badge_color": "default",
        "description": "For individuals & small teams",
        "features": ["500 credits / month", *_COMMON, "Email support"],
    },
    Plan.PRO.value: {
        "name": "Pro",
        "price_usd": 29,
        "monthly_credits": 2000,
        "badge_color": "default",
        "description": "For power users & growing teams",
        "features": ["2 000 credits / month", *_COMMON, "Priority support", "API access"],
    },
    Plan.TEAM.value: {
        "name": "Team",
        "price_usd": 79,
        "monthly_credits": TEAM_SEAT_CREDITS,
        "seats": TEAM_SEATS,
        "badge_color": "default",
        "description": "For teams collaborating on documents",
        "features": [
            f"{TEAM_SEATS} seats, 1 500 credits / seat",
            "Shared document library",
            "Roles: Admin / Editor / Viewer",
            "Team usage dashboard",
            "Shared prompts & comments",
        ],
    },
}
