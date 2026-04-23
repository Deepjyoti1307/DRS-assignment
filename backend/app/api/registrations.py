"""
Registration API Routes
~~~~~~~~~~~~~~~~~~~~~~~
Public:
  POST   /api/registrations                      → Register for an event
Organizer (auth required):
  GET    /api/events/{event_id}/registrations     → List registrations for an event
  PATCH  /api/registrations/{registration_id}     → Update registration status
"""

from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, EmailStr

from app.core.auth import get_current_user
from app.models.registration import RSVPStatus
from app.services.registration_service import (
    create_registration,
    list_registrations,
    update_registration_status,
)

router = APIRouter(tags=["registrations"])


# ── Request / Response schemas ───────────────────────

class RegistrationCreate(BaseModel):
    """Public registration request body."""
    event_id: str
    attendee_email: str = Field(..., description="Attendee's email address")
    attendee_name: str = Field(..., min_length=1, max_length=200)
    custom_fields: Optional[Dict[str, Any]] = None


class StatusUpdate(BaseModel):
    """Organizer status-change request body."""
    status: RSVPStatus


# ═══════════════════════════════════════════════════════
#  PUBLIC — No auth required
# ═══════════════════════════════════════════════════════

@router.post("/api/registrations", status_code=201)
async def register(payload: RegistrationCreate):
    """
    Register an attendee for a published event.
    No authentication required — this is the public-facing endpoint.
    """
    registration = await create_registration(
        event_id=payload.event_id,
        attendee_email=payload.attendee_email,
        attendee_name=payload.attendee_name,
        custom_fields=payload.custom_fields,
    )
    return registration


# ═══════════════════════════════════════════════════════
#  ORGANIZER — Auth required
# ═══════════════════════════════════════════════════════

@router.get("/api/events/{event_id}/registrations")
async def get_registrations(
    event_id: str,
    status: Optional[RSVPStatus] = Query(None, description="Filter by RSVP status"),
    user=Depends(get_current_user),
):
    """
    List all registrations for a specific event.
    Only the organizer who owns the event can access this.
    """
    organizer_id = user.get("sub") or user.get("user_id")
    return await list_registrations(event_id, organizer_id, status)


@router.patch("/api/registrations/{registration_id}")
async def update_status(
    registration_id: str,
    payload: StatusUpdate,
    user=Depends(get_current_user),
):
    """
    Update a registration's RSVP status (approve, reject, revoke).
    Enforces state-machine rules and capacity limits.
    Only the organizer who owns the parent event can perform this action.
    """
    organizer_id = user.get("sub") or user.get("user_id")
    return await update_registration_status(
        registration_id=registration_id,
        target_status=payload.status,
        organizer_id=organizer_id,
    )
