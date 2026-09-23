from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas, database
from ..services import credit_service, team_service as ts
from .routes import get_current_user

router = APIRouter()

CATEGORIES = ("HR", "Legal", "Finance", "General")


def _now():
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Team, invites, members
# ---------------------------------------------------------------------------

@router.get("/teams/me")
async def my_team(db: Session = Depends(database.get_db), user: models.User = Depends(get_current_user)):
    """Current user's team (or null) plus invites addressed to their email."""
    team = None
    member = ts.get_membership(db, user)
    if member:
        t = db.get(models.Team, member.team_id)
        members = db.query(models.TeamMember).filter(models.TeamMember.team_id == t.id).all()
        invites = db.query(models.TeamInvite).filter(models.TeamInvite.team_id == t.id).all()
        team = {
            "id": t.id, "name": t.name, "role": member.role, "seats": ts.SEATS,
            "members": [{"user_id": m.user_id, "name": m.user.name, "email": m.user.email, "role": m.role} for m in members],
            "invites": [{"id": i.id, "email": i.email, "role": i.role} for i in invites] if member.role in ts.CAN_MANAGE else [],
        }
    pending = db.query(models.TeamInvite).filter(models.TeamInvite.email == user.email.lower()).all()
    return {
        "team": team,
        "pending_invites": [{"id": i.id, "team_name": i.team.name, "role": i.role} for i in pending],
    }


@router.post("/teams")
async def create_team(
    body: schemas.TeamCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    if user.plan != "team":
        raise HTTPException(status_code=403, detail="Upgrade to the Team plan to create a workspace")
    if ts.get_membership(db, user):
        raise HTTPException(status_code=400, detail="You are already in a team")
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Team name is required")
    team = models.Team(name=body.name.strip(), owner_id=user.id, created_at=_now())
    db.add(team)
    db.flush()
    db.add(models.TeamMember(team_id=team.id, user_id=user.id, role="owner"))
    db.commit()
    return {"id": team.id, "name": team.name}


@router.post("/teams/{team_id}/invite")
async def invite_member(
    team_id: int,
    body: schemas.TeamInviteRequest,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    actor = ts.require_member(db, user, team_id, manage=True)
    if body.role not in ts.ASSIGNABLE_ROLES or (body.role == "admin" and actor.role != "owner"):
        raise HTTPException(status_code=400, detail="Invalid role")
    email = body.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if ts.seats_used(db, team_id) >= ts.SEATS:
        raise HTTPException(status_code=400, detail=f"All {ts.SEATS} seats are in use")
    already_member = (
        db.query(models.TeamMember).join(models.User, models.User.id == models.TeamMember.user_id)
        .filter(models.TeamMember.team_id == team_id, func.lower(models.User.email) == email).first()
    )
    already_invited = db.query(models.TeamInvite).filter(
        models.TeamInvite.team_id == team_id, models.TeamInvite.email == email).first()
    if already_member or already_invited:
        raise HTTPException(status_code=400, detail="Already a member or invited")
    invite = models.TeamInvite(team_id=team_id, email=email, role=body.role, created_at=_now())
    db.add(invite)
    db.commit()
    return {"id": invite.id, "email": invite.email, "role": invite.role}


@router.post("/teams/invites/{invite_id}/accept")
async def accept_invite(
    invite_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    invite = db.get(models.TeamInvite, invite_id)
    if not invite or invite.email != user.email.lower():
        raise HTTPException(status_code=404, detail="Invite not found")
    if ts.get_membership(db, user):
        raise HTTPException(status_code=400, detail="Leave your current team before joining another")
    db.add(models.TeamMember(team_id=invite.team_id, user_id=user.id, role=invite.role))
    db.delete(invite)
    credit_service.add_credits(db, user, ts.SEAT_CREDITS, "team_seat")  # commits
    return {"message": "Joined team"}


@router.delete("/teams/invites/{invite_id}")
async def cancel_invite(
    invite_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    """Invitee declines, or an owner/admin revokes."""
    invite = db.get(models.TeamInvite, invite_id)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.email != user.email.lower():
        ts.require_member(db, user, invite.team_id, manage=True)
    db.delete(invite)
    db.commit()
    return {"message": "Invite removed"}


def _target(db: Session, actor: models.TeamMember, team_id: int, user_id: int) -> models.TeamMember:
    target = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id, models.TeamMember.user_id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "owner" or (target.role == "admin" and actor.role != "owner"):
        raise HTTPException(status_code=403, detail="You can't change this member")
    return target


@router.patch("/teams/{team_id}/members/{user_id}")
async def change_role(
    team_id: int,
    user_id: int,
    body: schemas.RoleUpdate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    actor = ts.require_member(db, user, team_id, manage=True)
    target = _target(db, actor, team_id, user_id)
    if body.role not in ts.ASSIGNABLE_ROLES or (body.role == "admin" and actor.role != "owner"):
        raise HTTPException(status_code=400, detail="Invalid role")
    target.role = body.role
    db.commit()
    return {"user_id": user_id, "role": target.role}


@router.delete("/teams/{team_id}/members/{user_id}")
async def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    """Owners/admins remove members; any non-owner member may remove themself (leave)."""
    actor = ts.require_member(db, user, team_id)
    if user_id == user.id:
        if actor.role == "owner":
            raise HTTPException(status_code=400, detail="The owner can't leave the team")
        target = actor
    else:
        if actor.role not in ts.CAN_MANAGE:
            raise HTTPException(status_code=403, detail="Only owners and admins can do this")
        target = _target(db, actor, team_id, user_id)
    db.delete(target)
    db.commit()
    return {"message": "Member removed"}


@router.get("/teams/{team_id}/usage")
async def team_usage(
    team_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.require_member(db, user, team_id, manage=True)
    rows = []
    for m in db.query(models.TeamMember).filter(models.TeamMember.team_id == team_id).all():
        tx = models.CreditTransaction
        spent = db.query(func.coalesce(func.sum(tx.amount), 0)).filter(tx.user_id == m.user_id, tx.amount < 0).scalar()
        last = db.query(func.max(tx.created_at)).filter(tx.user_id == m.user_id).scalar()
        docs = db.query(models.Document).filter(
            models.Document.team_id == team_id, models.Document.user_id == m.user_id).count()
        rows.append({
            "user_id": m.user_id, "name": m.user.name, "email": m.user.email, "role": m.role,
            "credits_used": -spent, "docs_uploaded": docs,
            "last_active": last.isoformat() if last else None,
        })
    return {"members": rows}


# ---------------------------------------------------------------------------
# Shared prompt library
# ---------------------------------------------------------------------------

@router.get("/teams/{team_id}/prompts")
async def list_prompts(
    team_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.require_member(db, user, team_id)
    prompts = db.query(models.TeamPrompt).filter(models.TeamPrompt.team_id == team_id).order_by(models.TeamPrompt.id.desc()).all()
    return [{"id": p.id, "title": p.title, "prompt": p.prompt, "category": p.category} for p in prompts]


@router.post("/teams/{team_id}/prompts")
async def add_prompt(
    team_id: int,
    body: schemas.PromptCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.require_member(db, user, team_id, manage=True)
    if body.category not in CATEGORIES or not body.title.strip() or not body.prompt.strip():
        raise HTTPException(status_code=400, detail="Title, prompt and a valid category are required")
    p = models.TeamPrompt(team_id=team_id, title=body.title.strip(), prompt=body.prompt.strip(),
                          category=body.category, created_at=_now())
    db.add(p)
    db.commit()
    return {"id": p.id, "title": p.title, "prompt": p.prompt, "category": p.category}


@router.delete("/teams/{team_id}/prompts/{prompt_id}")
async def delete_prompt(
    team_id: int,
    prompt_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.require_member(db, user, team_id, manage=True)
    p = db.query(models.TeamPrompt).filter(models.TeamPrompt.id == prompt_id, models.TeamPrompt.team_id == team_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prompt not found")
    db.delete(p)
    db.commit()
    return {"message": "Prompt deleted"}


# ---------------------------------------------------------------------------
# Document comments
# ---------------------------------------------------------------------------

def _comment(c: models.Comment) -> dict:
    return {"id": c.id, "user_name": c.user.name, "content": c.content, "page": c.page,
            "resolved": c.resolved, "created_at": c.created_at.isoformat()}


@router.get("/documents/{document_id}/comments")
async def list_comments(
    document_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.get_document(db, user, document_id)
    comments = db.query(models.Comment).filter(models.Comment.document_id == document_id).order_by(models.Comment.id).all()
    return [_comment(c) for c in comments]


@router.post("/documents/{document_id}/comments")
async def add_comment(
    document_id: int,
    body: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    ts.get_document(db, user, document_id)
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Comment can't be empty")
    c = models.Comment(document_id=document_id, user_id=user.id, content=body.content.strip(),
                       page=body.page, created_at=_now())
    db.add(c)
    db.commit()
    db.refresh(c)
    return _comment(c)


@router.patch("/comments/{comment_id}/resolve")
async def toggle_resolved(
    comment_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user),
):
    c = db.get(models.Comment, comment_id)
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    ts.get_document(db, user, c.document_id)
    c.resolved = not c.resolved
    db.commit()
    return _comment(c)
