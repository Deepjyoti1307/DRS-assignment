"""
Email Service — Registration Lifecycle Notifications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Non-blocking trigger points for registration events.
All calls are fire-and-forget: failures are logged but never crash the main flow.

Replace the _send_email() stub with your real provider (SendGrid, SES, Resend, etc.)
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)


# ── Provider stub ────────────────────────────────────

async def _send_email(to: str, subject: str, body: str) -> None:
    """
    Stub — replace with your real email provider.
    e.g. SendGrid, AWS SES, Resend, Postmark, etc.
    """
    logger.info(f"[EMAIL] To: {to} | Subject: {subject}")
    # TODO: Integrate real email provider here
    # Example with SendGrid:
    #   import sendgrid
    #   sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
    #   ...


# ── Non-blocking wrapper ────────────────────────────

def _fire_and_forget(coro):
    """
    Schedule a coroutine to run in the background.
    Swallows all exceptions so the main request flow is never blocked.
    """
    async def _wrapped():
        try:
            await coro
        except Exception:
            logger.exception("[EMAIL] Background email task failed (non-blocking)")

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_wrapped())
    except RuntimeError:
        logger.warning("[EMAIL] No running event loop — skipping email trigger")


# ═══════════════════════════════════════════════════════
#  Public triggers — called from registration_service
# ═══════════════════════════════════════════════════════

def trigger_registration_received(
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
) -> None:
    """Fires after a new registration is created."""
    subject = f"Registration Received — {event_title}"
    if status == "registered":
        body = (
            f"Hi {attendee_name},\n\n"
            f"You're confirmed for '{event_title}'! "
            f"We look forward to seeing you there.\n\n"
            f"— The Eventic Team"
        )
    else:
        body = (
            f"Hi {attendee_name},\n\n"
            f"We've received your registration for '{event_title}'. "
            f"The organizer will review your application shortly.\n\n"
            f"— The Eventic Team"
        )
    _fire_and_forget(_send_email(attendee_email, subject, body))


def trigger_registration_approved(
    attendee_email: str,
    attendee_name: str,
    event_title: str,
) -> None:
    """Fires when an organizer approves a registration."""
    subject = f"You're In! — {event_title}"
    body = (
        f"Hi {attendee_name},\n\n"
        f"Great news! Your registration for '{event_title}' has been approved. "
        f"See you at the event!\n\n"
        f"— The Eventic Team"
    )
    _fire_and_forget(_send_email(attendee_email, subject, body))


def trigger_registration_rejected(
    attendee_email: str,
    attendee_name: str,
    event_title: str,
) -> None:
    """Fires when an organizer rejects a registration."""
    subject = f"Registration Update — {event_title}"
    body = (
        f"Hi {attendee_name},\n\n"
        f"Unfortunately, your registration for '{event_title}' was not accepted this time. "
        f"We appreciate your interest and hope to see you at future events.\n\n"
        f"— The Eventic Team"
    )
    _fire_and_forget(_send_email(attendee_email, subject, body))


def trigger_registration_revoked(
    attendee_email: str,
    attendee_name: str,
    event_title: str,
) -> None:
    """Fires when an organizer revokes a registration."""
    subject = f"Registration Revoked — {event_title}"
    body = (
        f"Hi {attendee_name},\n\n"
        f"Your registration for '{event_title}' has been revoked by the organizer. "
        f"If you believe this is an error, please contact the event organizer directly.\n\n"
        f"— The Eventic Team"
    )
    _fire_and_forget(_send_email(attendee_email, subject, body))
