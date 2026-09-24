from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import CreditTransaction, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        """Case-insensitive: older accounts were stored with whatever casing was typed."""
        return self.db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user


class CreditRepository:
    def __init__(self, db: Session):
        self.db = db

    def add_transaction(self, user_id: int, amount: int, reason: str) -> CreditTransaction:
        tx = CreditTransaction(user_id=user_id, amount=amount, reason=reason)
        self.db.add(tx)
        return tx

    def history(self, user_id: int, limit: int = 50) -> list[CreditTransaction]:
        return (
            self.db.query(CreditTransaction)
            .filter(CreditTransaction.user_id == user_id)
            .order_by(CreditTransaction.created_at.desc(), CreditTransaction.id.desc())
            .limit(limit)
            .all()
        )

    def spent(self, user_id: int) -> int:
        total = (
            self.db.query(func.coalesce(func.sum(CreditTransaction.amount), 0))
            .filter(CreditTransaction.user_id == user_id, CreditTransaction.amount < 0)
            .scalar()
        )
        return -int(total)

    def last_activity(self, user_id: int):
        return self.db.query(func.max(CreditTransaction.created_at)).filter(
            CreditTransaction.user_id == user_id).scalar()
