"""Transactional email.

Sends through SMTP when SMTP_HOST is configured. Otherwise (local development)
the message is written to the server log so flows like password reset can be
exercised without a mail provider. In production an unconfigured SMTP setup logs
an error instead of printing the message, since it would contain a live link.
"""
import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def frontend_url() -> str:
    return os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def send_email(to: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
    """Send an email. Returns True if it was handed to an SMTP server."""
    host = os.environ.get("SMTP_HOST")
    if not host:
        if os.environ.get("ENVIRONMENT", "development") == "production":
            logger.error("SMTP_HOST is not configured; email to %s was not sent", to)
        else:
            logger.warning("SMTP not configured. Email to %s\nSubject: %s\n\n%s", to, subject, text_body)
        return False

    msg = EmailMessage()
    msg["From"] = os.environ.get("SMTP_FROM", "DocuQuery <no-reply@docuquery.app>")
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text_body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()
        with server:
            if user and password:
                server.login(user, password)
            server.send_message(msg)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False


def send_password_reset_email(to: str, name: str, token: str, minutes: int) -> bool:
    link = f"{frontend_url()}/reset-password?token={token}"
    first = (name or "there").split()[0]
    text_body = (
        f"Hi {first},\n\n"
        f"Someone asked to reset the password for your DocuQuery account. "
        f"Use the link below within {minutes} minutes to choose a new one:\n\n"
        f"{link}\n\n"
        f"If this wasn't you, you can ignore this email. Your password won't change.\n\n"
        f"— DocuQuery"
    )
    html_body = f"""\
<div style="font-family:Manrope,Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;color:#10213e">
  <h2 style="letter-spacing:-0.03em">Reset your password</h2>
  <p>Hi {first},</p>
  <p>Someone asked to reset the password for your DocuQuery account. This link works for {minutes} minutes.</p>
  <p><a href="{link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:9px;text-decoration:none;font-weight:700">Choose a new password</a></p>
  <p style="color:#64748b;font-size:13px">If this wasn't you, ignore this email. Your password won't change.</p>
</div>"""
    return send_email(to, "Reset your DocuQuery password", text_body, html_body)
