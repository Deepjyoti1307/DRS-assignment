import asyncio
import logging
import smtplib
from email.message import EmailMessage
from typing import Optional

from app.core.config import get_settings
from app.models.email_log import EmailLog
from app.services.email_templates import (
    get_registration_template,
    get_event_update_template
)

logger = logging.getLogger(__name__)

def _send_smtp_sync(msg: EmailMessage, settings):
    """Synchronous SMTP send helper."""
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_port == 587:
            server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)

async def _send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None,
    event_id: Optional[str] = None,
    registration_id: Optional[str] = None,
    trigger: str = "unknown"
):
    """Internal helper to send email via SMTP and log it."""
    settings = get_settings()
    
    # If SMTP is not configured, we just log locally
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning(f"SMTP not configured. Email to {to_email} skipped. Subject: {subject}")
        log = EmailLog(
            to_email=to_email,
            subject=subject,
            body=body_text,
            event_id=event_id,
            registration_id=registration_id,
            status="skipped",
            trigger=trigger
        )
        await log.insert()
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.from_email or settings.smtp_user
    msg["To"] = to_email
    msg.set_content(body_text)
    
    if body_html:
        msg.add_alternative(body_html, subtype="html")

    try:
        await asyncio.to_thread(_send_smtp_sync, msg, settings)
        status = "sent"
        error_msg = None
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        status = "failed"
        error_msg = str(e)

    # Persist log
    log = EmailLog(
        to_email=to_email,
        subject=subject,
        body=body_html or body_text,
        event_id=event_id,
        registration_id=registration_id,
        status=status,
        error_message=error_msg,
        trigger=trigger
    )
    await log.insert()

def _fire_and_forget(coro):
    """Schedules a coroutine to run in the background."""
    async def _wrapped():
        try:
            await coro
        except Exception:
            logger.exception("[EMAIL] Background email task failed")

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_wrapped())
    except RuntimeError:
        logger.warning("[EMAIL] No running event loop — skipping email")

# ═══════════════════════════════════════════════════════
#  Public triggers
# ═══════════════════════════════════════════════════════

def trigger_registration_received(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
    venue: str = "TBD",
    date: str = "TBD"
) -> None:
    subject = f"Registration Received — {event_title}"
    html = get_registration_template(event_title, attendee_name, status, venue, date)
    text = f"Hi {attendee_name}, your registration for {event_title} is {status}."
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="registration_received"
    ))

def trigger_registration_approved(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    venue: str = "TBD",
    date: str = "TBD"
) -> None:
    subject = f"You're In! — {event_title}"
    html = get_registration_template(event_title, attendee_name, "approved", venue, date)
    text = f"Hi {attendee_name}, your registration for {event_title} has been approved."
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="approved"
    ))

def trigger_registration_rejected(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    venue: str = "TBD",
    date: str = "TBD"
) -> None:
    subject = f"Registration Update — {event_title}"
    html = get_registration_template(event_title, attendee_name, "rejected", venue, date)
    text = f"Hi {attendee_name}, unfortunately your registration for {event_title} was rejected."
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="rejected"
    ))

def trigger_registration_revoked(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    venue: str = "TBD",
    date: str = "TBD"
) -> None:
    subject = f"Registration Revoked — {event_title}"
    html = get_registration_template(event_title, attendee_name, "revoked", venue, date)
    text = f"Hi {attendee_name}, your registration for {event_title} has been revoked."
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="revoked"
    ))

def trigger_event_updated(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
) -> None:
    subject = f"Event Update: {event_title}"
    msg = "There has been an update to the event details. Please check the dashboard for the latest information."
    html = get_event_update_template(event_title, msg)
    text = f"Hi {attendee_name}, {event_title} has been updated. {msg}"
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="event_updated"
    ))

def trigger_event_cancelled(
    registration_id: str,
    attendee_email: str,
    attendee_name: str,
    event_title: str,
) -> None:
    subject = f"Event Cancelled: {event_title}"
    msg = "We regret to inform you that the event has been cancelled. We apologize for any inconvenience."
    html = get_event_update_template(event_title, msg, is_cancelled=True)
    text = f"Hi {attendee_name}, {event_title} has been cancelled."
    
    _fire_and_forget(_send_email(
        attendee_email, subject, text, html, 
        registration_id=registration_id, trigger="event_cancelled"
    ))
