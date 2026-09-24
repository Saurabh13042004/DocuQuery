import pytest

from app.domain import permissions as p
from app.domain.enums import Role

O, A, E, V = Role.OWNER, Role.ADMIN, Role.EDITOR, Role.VIEWER


@pytest.mark.parametrize("role,expected", [(None, True), (O, True), (A, True), (E, True), (V, False)])
def test_can_upload(role, expected):
    assert p.can_upload(role) is expected


@pytest.mark.parametrize("role,expected", [(O, True), (A, True), (E, True), (V, False)])
def test_can_edit_pdf(role, expected):
    assert p.can_edit_pdf(role) is expected


@pytest.mark.parametrize("role,expected", [(O, True), (A, True), (E, False), (V, False)])
def test_can_manage_team(role, expected):
    assert p.can_manage_team(role) is expected


@pytest.mark.parametrize("role,uploader,expected", [
    (O, False, True), (A, False, True),
    (E, True, True), (E, False, False),      # editors delete only their own
    (V, True, False), (V, False, False),
])
def test_can_delete_document(role, uploader, expected):
    assert p.can_delete_document(role, is_uploader=uploader) is expected


@pytest.mark.parametrize("actor,target,expected", [
    (O, A, True), (O, E, True), (O, V, True), (O, O, False),
    (A, E, True), (A, V, True), (A, A, False), (A, O, False),
    (E, V, False), (V, V, False),
])
def test_can_change_member(actor, target, expected):
    assert p.can_change_member(actor, target) is expected


@pytest.mark.parametrize("actor,new_role,expected", [
    (O, A, True), (O, E, True), (O, V, True), (O, O, False),
    (A, A, False), (A, E, True), (A, V, True),
])
def test_can_assign_role(actor, new_role, expected):
    assert p.can_assign_role(actor, new_role) is expected
