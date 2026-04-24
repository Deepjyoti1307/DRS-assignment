"""
Registration Service
~~~~~~~~~~~~~~~~~~~~
Centralises all business logic for attendee registrations:
  • Public registration (respects event mode, status, capacity)
  • Organizer status updates with state-machine enforcement
  • Organizer isolation — can only touch registrations on own events
  • Capacity accounting (approved/registered consume; revoke frees)
"""

from datetime import datetime, timezone
from typing import Optional, List

from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import HTTPException


def _safe_id(id_str: str) -> PydanticObjectId:
    """Safely convert string to PydanticObjectId or raise 400."""
    try:
        return PydanticObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid ID format: {id_str}")

from app.models.event import Event, EventStatus, RegistrationMode
from app.models.organizer import Organizer
from app.models.registration import (
    Registration,
    RSVPStatus,
    StatusHistoryItem,
    OPEN_TRANSITIONS,
    SHORTLISTED_TRANSITIONS,
)
from app.services.email_service import (
    trigger_registration_received,
    trigger_registration_approved,
    trigger_registration_rejected,
    trigger_registration_revoked,
)
from app.services.integrations.hubspot_service import trigger_hubspot_sync


# ── Capacity helpers ─────────────────────────────────

# These statuses count toward the event's capacity limit.
_CAPACITY_CONSUMING_STATUSES = {RSVPStatus.registered, RSVPStatus.approved}


async def _count_active_registrations(event_id: str) -> int:
    """Return the number of registrations that currently consume capacity."""
    return await Registration.find(
        Registration.event_id == event_id,
        In(Registration.status, list(_CAPACITY_CONSUMING_STATUSES)),
    ).count()


async def _assert_capacity_available(event: Event) -> None:
    """Raise 409 if the event has no remaining capacity."""
    active = await _count_active_registrations(str(event.id))
    if active >= event.capacity:
        raise HTTPException(
            status_code=409,
            detail=f"Event is full ({event.capacity}/{event.capacity} spots taken)",
        )


# ── Event guard helpers ──────────────────────────────

async def _get_published_event(event_id: str) -> Event:
    """
    Fetch an event that is published, not cancelled, and not in the past.
    Used by the public registration endpoint.
    """
    event = await Event.get(_safe_id(event_id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.status == EventStatus.cancelled:
        raise HTTPException(status_code=410, detail="Event has been cancelled")

    if event.status != EventStatus.published:
        raise HTTPException(status_code=400, detail="Event is not open for registration")

    if event.date_time <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Event has already passed")

    return event


async def _get_event_for_organizer(event_id: str, organizer_id: str) -> Event:
    """Fetch an event ensuring the caller is the owner."""
    event = await Event.get(_safe_id(event_id))
    if not event or event.organizer_id != organizer_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ── State machine ────────────────────────────────────

def _validate_transition(
    current: RSVPStatus,
    target: RSVPStatus,
    registration_mode: RegistrationMode,
) -> None:
    """
    Enforce the RSVP state machine rules.
    Raises 422 with a clear message on invalid transitions.
    """
    transitions = (
        OPEN_TRANSITIONS if registration_mode == RegistrationMode.open
        else SHORTLISTED_TRANSITIONS
    )

    allowed = transitions.get(current, set())
    if target not in allowed:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Invalid status transition: '{current.value}' → '{target.value}' "
                f"is not allowed in '{registration_mode.value}' mode. "
                f"Allowed next states: {sorted(s.value for s in allowed) or 'none (terminal state)'}"
            ),
        )


# ═══════════════════════════════════════════════════════
#  PUBLIC  —  Attendee-facing registration
# ═══════════════════════════════════════════════════════

async def create_registration(
    event_id: str,
    attendee_email: str,
    attendee_name: str,
    attendee_phone: Optional[str] = None,
    custom_fields: Optional[dict] = None,
) -> Registration:
    """
    Register an attendee for a published event.

    • Open mode   → status is set to `registered` immediately (consumes capacity).
    • Shortlisted → status is set to `pending` (does NOT consume capacity yet).
    """
    event = await _get_published_event(event_id)

    # Prevent duplicate registrations for the same email + event
    existing = await Registration.find_one(
        Registration.event_id == event_id,
        Registration.attendee_email == attendee_email,
        In(Registration.status, [
            RSVPStatus.registered,
            RSVPStatus.pending,
            RSVPStatus.approved,
        ]),
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="You have already registered for this event",
        )

    # Determine initial status based on event's registration mode
    if event.registration_mode == RegistrationMode.open:
        await _assert_capacity_available(event)
        initial_status = RSVPStatus.registered
    else:
        # Shortlisted mode — pending does not consume capacity
        initial_status = RSVPStatus.pending

    registration = Registration(
        event_id=event_id,
        organizer_id=event.organizer_id,
        attendee_email=attendee_email,
        attendee_name=attendee_name,
        attendee_phone=attendee_phone,
        status=initial_status,
        status_history=[StatusHistoryItem(status=initial_status)],
        registration_mode_snapshot=event.registration_mode,
        custom_fields=custom_fields,
    )
    await registration.insert()

    # ── Non-blocking triggers (fire-and-forget) ──
    trigger_registration_received(
        attendee_email=attendee_email,
        attendee_name=attendee_name,
        event_title=event.title,
        status=initial_status.value,
    )
    organizer = await Organizer.find_one(Organizer.clerk_user_id == event.organizer_id)
    trigger_hubspot_sync(
        registration_id=str(registration.id),
        organizer_hubspot_key=organizer.hubspot_api_key if organizer else None,
        attendee_email=attendee_email,
        attendee_name=attendee_name,
        event_title=event.title,
        status=initial_status.value,
    )

    return registration


# ═══════════════════════════════════════════════════════
#  ORGANIZER  —  Manage registrations
# ═══════════════════════════════════════════════════════

async def list_registrations(
    event_id: str,
    organizer_id: str,
    status_filter: Optional[RSVPStatus] = None,
) -> List[Registration]:
    """List all registrations for an event (organizer-isolated)."""
    # Verify ownership
    await _get_event_for_organizer(event_id, organizer_id)

    query = Registration.find(Registration.event_id == event_id)
    if status_filter:
        query = query.find(Registration.status == status_filter)

    return await query.sort("-created_at").to_list()


async def list_all_registrations(
    organizer_id: str,
    status_filter: Optional[RSVPStatus] = None,
) -> List[Registration]:
    """List all registrations across all events owned by the organizer."""
    query = Registration.find(Registration.organizer_id == organizer_id)
    if status_filter:
        query = query.find(Registration.status == status_filter)

    return await query.sort("-created_at").to_list()


async def update_registration_status(
    registration_id: str,
    target_status: RSVPStatus,
    organizer_id: str,
) -> Registration:
    """
    Transition a registration's status.

    Enforces:
      1. Organizer isolation (must own the parent event).
      2. State machine validity (only allowed transitions).
      3. Capacity limits (approval must not exceed event capacity).
    """
    reg = await Registration.get(_safe_id(registration_id))
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Isolation check
    event = await _get_event_for_organizer(reg.event_id, organizer_id)

    # State machine check
    _validate_transition(reg.status, target_status, event.registration_mode)

    # Capacity check — only when moving TO a capacity-consuming status
    if target_status in _CAPACITY_CONSUMING_STATUSES and reg.status not in _CAPACITY_CONSUMING_STATUSES:
        await _assert_capacity_available(event)

    # Apply
    reg.status = target_status
    reg.status_history.append(StatusHistoryItem(status=target_status))
    reg.updated_at = datetime.now(timezone.utc)
    await reg.save()

    # ── Non-blocking triggers (fire-and-forget) ──
    _STATUS_EMAIL_TRIGGERS = {
        RSVPStatus.approved: trigger_registration_approved,
        RSVPStatus.rejected: trigger_registration_rejected,
        RSVPStatus.revoked:  trigger_registration_revoked,
    }
    email_trigger = _STATUS_EMAIL_TRIGGERS.get(target_status)
    if email_trigger:
        email_trigger(
            attendee_email=reg.attendee_email,
            attendee_name=reg.attendee_name,
            event_title=event.title,
        )

    organizer = await Organizer.find_one(Organizer.clerk_user_id == event.organizer_id)
    trigger_hubspot_sync(
        registration_id=str(reg.id),
        organizer_hubspot_key=organizer.hubspot_api_key if organizer else None,
        attendee_email=reg.attendee_email,
        attendee_name=reg.attendee_name,
        event_title=event.title,
        status=target_status.value,
    )

    return reg


async def get_audit_logs(organizer_id: str, limit: int = 100) -> List[dict]:
    """
    Returns a flattened feed of status transitions across all registrations.
    """
    # Fetch registrations with their history
    regs = await Registration.find(Registration.organizer_id == organizer_id).to_list()
    
    # Flatten history items
    feed = []
    for r in regs:
        for h in r.status_history:
            feed.append({
                "registration_id": str(r.id),
                "attendee_name": r.attendee_name,
                "attendee_email": r.attendee_email,
                "event_id": r.event_id,
                "status": h.status,
                "changed_at": h.changed_at,
                "reason": h.reason
            })
            
    # Sort by time descending
    feed.sort(key=lambda x: x["changed_at"], reverse=True)
    return feed[:limit]


async def sync_all_to_hubspot(organizer_id: str) -> dict:
    """
    Force-sync all existing registrations for this organizer to HubSpot.
    Returns a summary of the operation.
    """
    organizer = await Organizer.find_one(Organizer.clerk_user_id == organizer_id)
    if not organizer or not organizer.hubspot_api_key:
        raise HTTPException(status_code=400, detail="HubSpot integration not configured")

    # Fetch all registrations for this organizer
    registrations = await Registration.find(Registration.organizer_id == organizer_id).to_list()
    
    # Fetch events in bulk to get titles efficiently
    event_ids = list(set(r.event_id for r in registrations))
    events = await Event.find(In(Event.id, [PydanticObjectId(eid) for eid in event_ids])).to_list()
    event_map = {str(e.id): e.title for e in events}

    count = 0
    for reg in registrations:
        trigger_hubspot_sync(
            registration_id=str(reg.id),
            organizer_hubspot_key=organizer.hubspot_api_key,
            attendee_email=reg.attendee_email,
            attendee_name=reg.attendee_name,
            event_title=event_map.get(reg.event_id, "Unknown Event"),
            status=reg.status.value,
        )
        count += 1

    return {"status": "success", "synced_count": count}
