from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.utils.time import utcnow


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)  # one team per user
    role = Column(String, nullable=False)  # owner | admin | editor | viewer

    user = relationship("User")


class TeamInvite(Base):
    __tablename__ = "team_invites"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    team = relationship("Team")


class TeamPrompt(Base):
    __tablename__ = "team_prompts"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    prompt = Column(Text, nullable=False)
    category = Column(String, nullable=False, default="General")
    created_at = Column(DateTime, default=utcnow)
