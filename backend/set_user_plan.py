"""Set a user's plan directly in the database (admin fix-up; there is no billing yet).

Only the plan changes: no credits are granted. A 0-credit entry is added to the credit history so
the change is traceable. Dry run by default:

    python set_user_plan.py you@example.com starter           # show what would change
    python set_user_plan.py you@example.com starter --apply   # do it
"""
import sys
from datetime import datetime, timezone

from app import database, models
from app.services import credit_service


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    apply = "--apply" in argv
    if len(args) != 2:
        print(__doc__)
        return 2
    email, plan = args[0].strip().lower(), args[1].strip().lower()
    if plan not in credit_service.PLANS:
        print(f"Unknown plan '{plan}'. Choose one of: {', '.join(credit_service.PLANS)}")
        return 2

    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email.ilike(email)).first()
        if not user:
            print(f"No user with email {email}")
            return 1
        print(f"{user.email}: plan {user.plan!r} -> {plan!r} (credits stay at {user.credits})")
        if user.plan == plan:
            print("Already on that plan; nothing to do.")
            return 0
        if not apply:
            print("Dry run. Re-run with --apply to make the change.")
            return 0
        user.plan = plan
        db.add(models.CreditTransaction(
            user_id=user.id, amount=0, reason=f"plan_set_{plan}", created_at=datetime.now(timezone.utc)))
        db.commit()
        db.refresh(user)
        print(f"Done: {user.email} is now on {user.plan!r} with {user.credits} credits.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
