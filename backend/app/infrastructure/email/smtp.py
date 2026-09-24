from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import Settings
from app.ports import PasswordResetMessage

logger = logging.getLogger(__name__)


class SmtpMailer:
    """Sends through SMTP when SMTP_HOST is set.

    Otherwise (local development) the message is written to the log so flows like password reset
    can be tried without a mail provider. In production a missing SMTP setup logs an error instead
    of printing the message, since it would contain a live link.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    def send_password_reset(self, message: PasswordResetMessage) -> bool:
        link = f"{self.settings.frontend_url}/reset-password?token={message.token}"
        first = (message.name or "there").split()[0]
        text = (
            f"Hi {first},\n\n"
            f"Someone asked to reset the password for your DocuQuery account. "
            f"Use the link below within {message.minutes} minutes to choose a new one:\n\n"
            f"{link}\n\n"
            f"If this wasn't you, you can ignore this email. Your password won't change.\n\n"
            f"— DocuQuery"
        )
        html = f"""\
<div style="font-family:Manrope,Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;color:#10213e">
  <h2 style="letter-spacing:-0.03em">Reset your password</h2>
  <p>Hi {first},</p>
  <p>Someone asked to reset the password for your DocuQuery account. This link works for {message.minutes} minutes.</p>
  <p><a href="{link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:9px;text-decoration:none;font-weight:700">Choose a new password</a></p>
  <p style="color:#64748b;font-size:13px">If this wasn't you, ignore this email. Your password won't change.</p>
</div>"""
        return self._send(message.to, "Reset your DocuQuery password", text, html)

    def _send(self, to: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
        s = self.settings
        if not s.smtp_host:
            if s.is_production:
                logger.error("SMTP_HOST is not configured; email to %s was not sent", to)
            else:
                logger.warning("SMTP not configured. Email to %s\nSubject: %s\n\n%s", to, subject, text_body)
            return False

        msg = EmailMessage()
        msg["From"], msg["To"], msg["Subject"] = s.smtp_from, to, subject
        msg.set_content(text_body)
        if html_body:
            msg.add_alternative(html_body, subtype="html")
        try:
            if s.smtp_port == 465:
                server = smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=15)
            else:
                server = smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15)
                server.starttls()
            with server:
                if s.smtp_user and s.smtp_password:
                    server.login(s.smtp_user, s.smtp_password)
                server.send_message(msg)
            return True
        except Exception:
            logger.exception("Failed to send email to %s", to)
            return False
