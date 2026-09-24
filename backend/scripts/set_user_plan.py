"""Set a user's plan directly in the database (admin fix-up; there is no billing yet).

Only the plan changes: no credits are granted. A 0-credit entry is added to the credit history so
the change is traceable. Dry run by default:

    python -m scripts.set_user_plan you@example.com starter           # show what would change
    python -m scripts.set_user_plan you@example.com starter --apply   # do it
"""
from __future__ import annotations

import sys

from sqlalchemy.orm import Session

from app.core.database import get_session_factory
from app.domain.enums import Plan
from app.repositories.users import CreditRepository, UserRepository


def set_plan(db: Session, email: str, plan: str, apply: bool, log=print) -> int:
    """Returns a process exit code."""
    try:
        plan = Plan(plan.strip().lower()).value
    except ValueError:
        log(f"Unknown plan '{plan}'. Choose one of: {', '.join(p.value for p in Plan)}")
        return 2

    user = UserRepository(db).get_by_email(email)
    if not user:
        log(f"No user with email {email.strip().lower()}")
        return 1
    log(f"{user.email}: plan {user.plan!r} -> {plan!r} (credits stay at {user.credits})")
    if user.plan == plan:
        log("Already on that plan; nothing to do.")
        return 0
    if not apply:
        log("Dry run. Re-run with --apply to make the change.")
        return 0

    user.plan = plan
    CreditRepository(db).add_transaction(user.id, 0, f"plan_set_{plan}")
    db.commit()
    db.refresh(user)
    log(f"Done: {user.email} is now on {user.plan!r} with {user.credits} credits.")
    return 0


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 2:
        print(__doc__)
        return 2
    db = get_session_factory()()
    try:
        return set_plan(db, args[0], args[1], apply="--apply" in argv)
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
