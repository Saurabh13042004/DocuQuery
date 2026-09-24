"""Reusable validated field types."""
import re
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_email(value: str) -> str:
    value = value.strip().lower()
    if len(value) > 254 or not _EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address")
    return value


Email = Annotated[str, AfterValidator(_normalize_email)]
PersonName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Password = Annotated[str, Field(min_length=8, max_length=128)]  # bcrypt ignores anything past 72 bytes anyway


class ORMModel(BaseModel):
    """Response models are built straight from ORM rows."""
    model_config = ConfigDict(from_attributes=True)


class MessageOut(BaseModel):
    message: str
