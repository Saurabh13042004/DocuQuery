import pytest

from app.core.exceptions import BadRequestError, InsufficientCreditsError
from app.domain.enums import Operation, Plan
from tests.factories import make_user


def test_deducting_charges_the_operation_price_and_logs_it(svc):
    user = make_user(svc, credits=10)
    assert svc.credits.check_and_deduct(user, Operation.UPLOAD) == 8
    assert svc.credits.check_and_deduct(user, Operation.ASK) == 7
    history = {t.reason: t.amount for t in svc.credits.history(user)}
    assert history["upload"] == -2 and history["ask"] == -1


def test_not_enough_credits_raises_a_structured_402_error_and_charges_nothing(svc):
    user = make_user(svc, credits=1)
    with pytest.raises(InsufficientCreditsError) as e:
        svc.credits.check_and_deduct(user, Operation.UPLOAD)
    assert e.value.status_code == 402
    assert e.value.detail == {
        "error": "insufficient_credits", "credits_needed": 2, "credits_available": 1, "plan": "free",
        "message": "Not enough credits. 'upload' costs 2 credit(s) but you have 1.",
    }
    assert user.credits == 1


def test_refund_gives_back_the_price_and_is_labelled(svc):
    user = make_user(svc, credits=10)
    svc.credits.check_and_deduct(user, Operation.UPLOAD)
    assert svc.credits.refund(user, Operation.UPLOAD) == 10
    assert "upload_refund" in {t.reason for t in svc.credits.history(user)}


def test_upgrading_grants_the_monthly_credits_and_logs_them(svc):
    user = make_user(svc, credits=20)
    svc.credits.change_plan(user, Plan.STARTER)
    assert (user.plan, user.credits) == ("starter", 520)
    assert {t.reason: t.amount for t in svc.credits.history(user)}["plan_upgrade_starter"] == 500


def test_switching_to_a_plan_without_credits_keeps_the_balance_but_leaves_a_trail(svc):
    user = make_user(svc, plan="starter", credits=500)
    svc.credits.change_plan(user, Plan.FREE)
    assert (user.plan, user.credits) == ("free", 500)
    assert {t.reason: t.amount for t in svc.credits.history(user)}["plan_switch_free"] == 0


def test_choosing_the_current_plan_is_rejected(svc):
    with pytest.raises(BadRequestError, match="Already on this plan"):
        svc.credits.change_plan(make_user(svc), Plan.FREE)


def test_history_is_newest_first_and_limited(svc):
    user = make_user(svc, credits=100)
    for _ in range(5):
        svc.credits.check_and_deduct(user, Operation.ASK)
    history = svc.credits.history(user, limit=3)
    assert len(history) == 3 and history[0].id > history[1].id > history[2].id


def test_plans_overview_lists_every_plan_with_prices(svc):
    overview = svc.credits.plans_overview(make_user(svc, credits=42))
    assert set(overview["plans"]) == {"free", "starter", "pro", "team"}
    assert overview["credits"] == 42 and overview["costs"] == {"upload": 2, "ask": 1, "edit": 2}
    assert overview["plans"]["team"]["price_usd"] == 79 and overview["plans"]["team"]["seats"] == 5
