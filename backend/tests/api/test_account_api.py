def test_me_returns_the_current_user(client, user):
    data = client.get("/me", headers=user.headers).json()
    assert data["email"] == user.email and data["credits"] == 20


def test_plans_lists_the_catalog_with_costs_and_the_users_balance(client, user):
    data = client.get("/plans", headers=user.headers).json()
    assert set(data) == {"plans", "current_plan", "credits", "costs"}
    assert data["current_plan"] == "free" and data["credits"] == 20 and data["costs"] == {"upload": 2, "ask": 1, "edit": 2}
    assert [data["plans"][k]["price_usd"] for k in ("free", "starter", "pro", "team")] == [0, 9, 29, 79]
    assert data["plans"]["starter"]["features"] and data["plans"]["starter"]["monthly_credits"] == 500


def test_upgrading_grants_credits_and_shows_up_in_the_history(client, user):
    resp = client.post("/upgrade-plan", headers=user.headers, json={"plan": "starter"})
    assert resp.status_code == 200 and (resp.json()["plan"], resp.json()["credits"]) == ("starter", 520)
    history = client.get("/credits/history", headers=user.headers).json()
    assert {(h["reason"], h["amount"]) for h in history} >= {("plan_upgrade_starter", 500), ("signup_bonus", 20)}
    assert set(history[0]) == {"id", "amount", "reason", "created_at"}


def test_switching_back_to_free_is_recorded(client, signup):
    user = signup(plan="starter")
    client.post("/upgrade-plan", headers=user.headers, json={"plan": "free"})
    reasons = [h["reason"] for h in client.get("/credits/history", headers=user.headers).json()]
    assert "plan_switch_free" in reasons
    assert client.get("/me", headers=user.headers).json()["credits"] == 520          # credits are kept


def test_unknown_or_current_plans_are_rejected(client, user):
    assert client.post("/upgrade-plan", headers=user.headers, json={"plan": "platinum"}).status_code == 422
    assert client.post("/upgrade-plan", headers=user.headers, json={}).status_code == 422
    same = client.post("/upgrade-plan", headers=user.headers, json={"plan": "free"})
    assert same.status_code == 400 and same.json() == {"detail": "Already on this plan"}


def test_history_is_private_to_each_user(client, signup):
    a, b = signup(), signup()
    client.post("/upgrade-plan", headers=a.headers, json={"plan": "pro"})
    assert "plan_upgrade_pro" not in [h["reason"] for h in client.get("/credits/history", headers=b.headers).json()]
