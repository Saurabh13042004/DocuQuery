import pytest

from app.core.exceptions import BadRequestError, NotFoundError, PermissionDeniedError
from app.domain.enums import AssignableRole as R, PromptCategory
from tests.factories import make_user

ADMIN, EDITOR, VIEWER = R.ADMIN, R.EDITOR, R.VIEWER


@pytest.fixture
def owner(svc):
    return make_user(svc, plan="team")


@pytest.fixture
def team(svc, owner):
    return svc.teams.create(owner, "Acme")


def join(svc, team, role: R = EDITOR):
    """Invite a fresh user by email and have them accept."""
    user = make_user(svc)
    invite = svc.teams.invite(svc.users.get(team.owner_id), team.id, user.email, role)
    svc.teams.accept_invite(user, invite.id)
    return user


# -- creating a workspace --------------------------------------------------------------------
def test_only_team_plan_users_can_create_a_workspace_and_only_one(svc, owner):
    with pytest.raises(PermissionDeniedError, match="Team plan"):
        svc.teams.create(make_user(svc), "Nope")
    team = svc.teams.create(owner, "Acme")
    assert team.name == "Acme" and svc.access.membership(owner).role == "owner"
    with pytest.raises(BadRequestError, match="already in a team"):
        svc.teams.create(owner, "Second")


# -- invites --------------------------------------------------------------------------------
def test_accepting_an_invite_adds_the_member_and_grants_the_seat_credits(svc, team, owner):
    user = make_user(svc)
    before = user.credits
    invite = svc.teams.invite(owner, team.id, user.email.upper(), EDITOR)         # email matching ignores case
    assert svc.teams.my_team(user).pending_invites[0].team_name == "Acme"
    svc.teams.accept_invite(user, invite.id)
    assert user.credits == before + 1500 and svc.access.membership(user).role == "editor"
    assert svc.teams.my_team(user).pending_invites == []


def test_only_the_invited_email_can_accept(svc, team, owner):
    invite = svc.teams.invite(owner, team.id, make_user(svc).email, EDITOR)
    with pytest.raises(NotFoundError):
        svc.teams.accept_invite(make_user(svc), invite.id)


def test_someone_already_in_a_team_cannot_accept_another_invite(svc, team):
    member = join(svc, team)
    other_owner = make_user(svc, plan="team")
    other_team = svc.teams.create(other_owner, "Other")
    invite = svc.teams.invite(other_owner, other_team.id, member.email, EDITOR)
    with pytest.raises(BadRequestError, match="Leave your current team"):
        svc.teams.accept_invite(member, invite.id)


def test_seats_are_capped_at_five_counting_pending_invites(svc, team, owner):
    for _ in range(4):
        svc.teams.invite(owner, team.id, make_user(svc).email, EDITOR)             # 1 owner + 4 pending = 5
    with pytest.raises(BadRequestError, match="All 5 seats"):
        svc.teams.invite(owner, team.id, make_user(svc).email, EDITOR)


def test_duplicate_invites_and_existing_members_are_rejected(svc, team, owner):
    member = join(svc, team)
    with pytest.raises(BadRequestError, match="Already a member"):
        svc.teams.invite(owner, team.id, member.email, EDITOR)
    email = make_user(svc).email
    svc.teams.invite(owner, team.id, email, EDITOR)
    with pytest.raises(BadRequestError, match="Already a member or invited"):
        svc.teams.invite(owner, team.id, email, VIEWER)


def test_only_managers_invite_and_only_the_owner_creates_admins(svc, team, owner):
    admin, editor = join(svc, team, ADMIN), join(svc, team, EDITOR)
    with pytest.raises(PermissionDeniedError):
        svc.teams.invite(editor, team.id, make_user(svc).email, VIEWER)
    with pytest.raises(BadRequestError, match="Invalid role"):
        svc.teams.invite(admin, team.id, make_user(svc).email, ADMIN)
    assert svc.teams.invite(admin, team.id, make_user(svc).email, VIEWER).role == "viewer"


def test_invites_can_be_declined_by_the_invitee_or_revoked_by_a_manager_but_not_by_others(svc, team, owner):
    invitee = make_user(svc)
    invite = svc.teams.invite(owner, team.id, invitee.email, EDITOR)
    with pytest.raises(NotFoundError):
        svc.teams.cancel_invite(make_user(svc), invite.id)             # an outsider is told nothing
    svc.teams.cancel_invite(invitee, invite.id)                         # decline
    revoked = svc.teams.invite(owner, team.id, invitee.email, EDITOR)
    svc.teams.cancel_invite(owner, revoked.id)                          # revoke
    with pytest.raises(NotFoundError):
        svc.teams.cancel_invite(owner, revoked.id)


def test_invites_are_only_visible_to_managers(svc, team, owner):
    editor = join(svc, team, EDITOR)
    svc.teams.invite(owner, team.id, make_user(svc).email, VIEWER)
    assert len(svc.teams.my_team(owner).team.invites) == 1
    assert svc.teams.my_team(editor).team.invites == []
    assert {m.role.value for m in svc.teams.my_team(editor).team.members} == {"owner", "editor"}


# -- members --------------------------------------------------------------------------------
def test_owner_changes_roles_but_admins_cannot_touch_admins_or_the_owner(svc, team, owner):
    admin, other_admin, editor = join(svc, team, ADMIN), join(svc, team, ADMIN), join(svc, team, EDITOR)
    assert svc.teams.change_role(owner, team.id, editor.id, VIEWER).role == "viewer"
    assert svc.teams.change_role(admin, team.id, editor.id, EDITOR).role == "editor"
    with pytest.raises(PermissionDeniedError):
        svc.teams.change_role(admin, team.id, other_admin.id, VIEWER)
    with pytest.raises(PermissionDeniedError):
        svc.teams.change_role(admin, team.id, owner.id, VIEWER)
    with pytest.raises(BadRequestError, match="Invalid role"):
        svc.teams.change_role(admin, team.id, editor.id, ADMIN)          # admins can't mint admins
    with pytest.raises(NotFoundError):
        svc.teams.change_role(owner, team.id, 99999, VIEWER)


def test_members_can_leave_but_the_owner_cannot(svc, team, owner):
    editor = join(svc, team)
    svc.teams.remove_member(editor, team.id, editor.id)
    assert svc.access.membership(editor) is None
    with pytest.raises(BadRequestError, match="owner can't leave"):
        svc.teams.remove_member(owner, team.id, owner.id)


def test_managers_remove_members_within_the_role_rules(svc, team, owner):
    admin, editor, viewer = join(svc, team, ADMIN), join(svc, team, EDITOR), join(svc, team, VIEWER)
    with pytest.raises(PermissionDeniedError):
        svc.teams.remove_member(editor, team.id, viewer.id)              # editors manage nobody
    with pytest.raises(PermissionDeniedError):
        svc.teams.remove_member(admin, team.id, owner.id)
    svc.teams.remove_member(admin, team.id, viewer.id)
    svc.teams.remove_member(owner, team.id, admin.id)
    assert {m.user_id for m in svc.team_repo.members(team.id)} == {owner.id, editor.id}


def test_usage_reports_credits_and_activity_per_member_to_managers_only(svc, team, owner):
    editor = join(svc, team)
    svc.credits.add_credits(editor, -7, "ask")
    usage = {row.user_id: row for row in svc.teams.usage(owner, team.id).members}
    assert usage[editor.id].credits_used == 7 and usage[editor.id].last_active
    assert set(usage) == {owner.id, editor.id}
    with pytest.raises(PermissionDeniedError):
        svc.teams.usage(editor, team.id)


# -- shared prompts -------------------------------------------------------------------------
def test_managers_publish_prompts_and_everyone_in_the_team_reads_them(svc, team, owner):
    viewer, editor = join(svc, team, VIEWER), join(svc, team, EDITOR)
    prompt = svc.teams.add_prompt(owner, team.id, "Summarise", "Summarise this", PromptCategory.LEGAL)
    assert [(p.title, p.category) for p in svc.teams.list_prompts(viewer, team.id)] == [("Summarise", "Legal")]
    with pytest.raises(PermissionDeniedError):
        svc.teams.add_prompt(editor, team.id, "x", "y", PromptCategory.HR)
    with pytest.raises(PermissionDeniedError):
        svc.teams.delete_prompt(editor, team.id, prompt.id)
    svc.teams.delete_prompt(owner, team.id, prompt.id)
    with pytest.raises(NotFoundError):
        svc.teams.delete_prompt(owner, team.id, prompt.id)
    assert svc.teams.list_prompts(owner, team.id) == []


def test_prompts_are_private_to_their_team(svc, team):
    with pytest.raises(NotFoundError):
        svc.teams.list_prompts(make_user(svc), team.id)
