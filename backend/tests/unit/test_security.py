import jwt
import pytest

from app.core import security

SECRET = "unit-test-secret-that-is-long-enough-for-hs256"


def test_password_hash_roundtrip_and_salting():
    hashed = security.hash_password("hunter2hunter2")
    assert hashed != "hunter2hunter2"
    assert security.verify_password("hunter2hunter2", hashed)
    assert not security.verify_password("wrong-password", hashed)
    assert security.hash_password("hunter2hunter2") != hashed  # salted


def test_verify_password_with_a_malformed_hash_is_false_not_an_error():
    assert security.verify_password("x", "not-a-bcrypt-hash") is False


def test_access_token_carries_the_subject_and_expires():
    payload = security.decode_token(security.create_access_token("a@b.com", SECRET, 5), SECRET)
    assert payload["sub"] == "a@b.com" and payload["exp"] > 0


def test_expired_and_tampered_tokens_are_rejected():
    with pytest.raises(jwt.ExpiredSignatureError):
        security.decode_token(security.create_access_token("a@b.com", SECRET, -1), SECRET)
    with pytest.raises(jwt.PyJWTError):
        security.decode_token(security.create_access_token("a@b.com", SECRET, 5), "another-secret-of-similar-length-xx")


def test_reset_token_has_no_subject_so_it_cannot_be_used_to_log_in():
    payload = security.decode_token(security.create_reset_token("a@b.com", "hash", SECRET, 5), SECRET)
    assert "sub" not in payload
    assert payload["purpose"] == security.RESET_PURPOSE and payload["email"] == "a@b.com"


def test_reset_token_fingerprint_changes_with_the_password():
    assert security.password_fingerprint("old-hash") != security.password_fingerprint("new-hash")
    assert security.password_fingerprint("same") == security.password_fingerprint("same")
