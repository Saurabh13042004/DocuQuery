"""Plan changes show up in the credit history, including the ones that grant no credits."""
from tests.test_teams import make_user


def test_plan_switches_are_recorded_in_credit_history(client):
    _, h = make_user(client, plan="starter")
    assert client.post("/upgrade-plan", headers=h, json={"plan": "free"}).status_code == 200

    history = client.get("/credits/history", headers=h).json()
    reasons = {t["reason"]: t["amount"] for t in history}
    assert reasons["plan_upgrade_starter"] == 500
    assert reasons["plan_switch_free"] == 0
    assert client.get("/me", headers=h).json()["plan"] == "free"
    assert client.get("/me", headers=h).json()["credits"] == 20 + 500  # credits are kept when switching
