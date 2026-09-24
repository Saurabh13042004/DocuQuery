import logging
from unittest.mock import MagicMock, patch

from app.core.config import Settings
from app.infrastructure.email.smtp import SmtpMailer
from app.ports import PasswordResetMessage

MESSAGE = PasswordResetMessage(to="ada@example.com", name="Ada Lovelace", token="TOKEN123", minutes=30)


def mailer(**overrides):
    return SmtpMailer(Settings.from_env({"DATABASE_URL": "x", "SECRET_KEY": "s" * 32,
                                         "FRONTEND_URL": "https://app.example.com", **overrides}))


def test_without_smtp_in_development_the_link_is_logged_and_nothing_is_sent(caplog):
    with caplog.at_level(logging.WARNING):
        assert mailer().send_password_reset(MESSAGE) is False
    assert "https://app.example.com/reset-password?token=TOKEN123" in caplog.text


def test_without_smtp_in_production_the_live_link_is_never_logged(caplog):
    with caplog.at_level(logging.ERROR):
        assert mailer(ENVIRONMENT="production").send_password_reset(MESSAGE) is False
    assert "TOKEN123" not in caplog.text and "SMTP_HOST is not configured" in caplog.text


def test_starttls_login_and_message_contents():
    server = MagicMock()
    server.__enter__.return_value = server
    with patch("app.infrastructure.email.smtp.smtplib.SMTP", return_value=server) as smtp:
        ok = mailer(SMTP_HOST="mail.example.com", SMTP_USER="u", SMTP_PASSWORD="p").send_password_reset(MESSAGE)
    assert ok and smtp.call_args.args[:2] == ("mail.example.com", 587)
    server.starttls.assert_called_once()
    server.login.assert_called_once_with("u", "p")
    sent = server.send_message.call_args.args[0]
    assert sent["To"] == "ada@example.com" and sent["Subject"] == "Reset your DocuQuery password"
    body = sent.get_body(("plain",)).get_content()
    assert "Hi Ada," in body and "within 30 minutes" in body and "reset-password?token=TOKEN123" in body
    assert "TOKEN123" in sent.get_body(("html",)).get_content()


def test_port_465_uses_implicit_tls_and_skips_login_without_credentials():
    server = MagicMock()
    server.__enter__.return_value = server
    with patch("app.infrastructure.email.smtp.smtplib.SMTP_SSL", return_value=server) as ssl:
        assert mailer(SMTP_HOST="h", SMTP_PORT="465").send_password_reset(MESSAGE)
    ssl.assert_called_once()
    server.login.assert_not_called()


def test_a_delivery_failure_returns_false_instead_of_raising():
    with patch("app.infrastructure.email.smtp.smtplib.SMTP", side_effect=OSError("down")):
        assert mailer(SMTP_HOST="h").send_password_reset(MESSAGE) is False
