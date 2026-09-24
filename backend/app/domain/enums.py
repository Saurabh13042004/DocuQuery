from enum import Enum


class Role(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class AssignableRole(str, Enum):
    """Roles that can be handed out. Ownership is never assigned."""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"


class Plan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    TEAM = "team"


class PromptCategory(str, Enum):
    HR = "HR"
    LEGAL = "Legal"
    FINANCE = "Finance"
    GENERAL = "General"


class Operation(str, Enum):
    """Things that cost credits."""
    UPLOAD = "upload"
    ASK = "ask"
    EDIT = "edit"
