"""
Registration API Routes
~~~~~~~~~~~~~~~~~~~~~~~
Public:
    POST   /api/events/{event_id}/register          → Register for an event
Organizer (auth required):
    GET    /api/events/{event_id}/registrations     → List registrations for an event
    PATCH  /api/registrations/{registration_id}/approve
    PATCH  /api/registrations/{registration_id}/reject
    PATCH  /api/registrations/{registration_id}/revoke
"""

from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.models.registration import RSVPStatus
from app.services.registration_service import (
    create_registration,
    list_registrations,
    list_all_registrations,
    update_registration_status,
    get_audit_logs,
)

router = APIRouter(tags=["registrations"])


# ── Request / Response schemas ───────────────────────

class RegistrationCreate(BaseModel):
    """Public registration request body."""
    attendee_email: str = Field(..., description="Attendee's email address")
    attendee_name: str = Field(..., min_length=1, max_length=200)
    attendee_phone: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class StatusUpdate(BaseModel):
    """Organizer status-change request body."""
    status: RSVPStatus


# ═══════════════════════════════════════════════════════
#  PUBLIC — No auth required
# ═══════════════════════════════════════════════════════

@router.post("/api/events/{event_id}/register", status_code=201)
async def register(event_id: str, payload: RegistrationCreate):
    """
    Register an attendee for a published event.
    No authentication required — this is the public-facing endpoint.
    """
    registration = await create_registration(
        event_id=event_id,
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


@router.get("/api/registrations")
async def get_all_registrations(
    status: Optional[RSVPStatus] = Query(None, description="Filter by RSVP status"),
    user=Depends(get_current_user),
):
    """
    List all registrations across all events for the current organizer.
    """
    organizer_id = user.get("sub") or user.get("user_id")
    return await list_all_registrations(organizer_id, status)


@router.get("/api/registrations/audit")
async def get_all_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    user=Depends(get_current_user),
):
    """
    Get a global feed of all status transitions across all registrations.
    """
    organizer_id = user.get("sub") or user.get("user_id")
    return await get_audit_logs(organizer_id, limit)


@router.patch("/api/registrations/{registration_id}/approve")
async def approve_registration(registration_id: str, user=Depends(get_current_user)):
    organizer_id = user.get("sub") or user.get("user_id")
    return await update_registration_status(
        registration_id=registration_id,
        target_status=RSVPStatus.approved,
        organizer_id=organizer_id,
    )


@router.patch("/api/registrations/{registration_id}/reject")
async def reject_registration(registration_id: str, user=Depends(get_current_user)):
    organizer_id = user.get("sub") or user.get("user_id")
    return await update_registration_status(
        registration_id=registration_id,
        target_status=RSVPStatus.rejected,
        organizer_id=organizer_id,
    )


@router.patch("/api/registrations/{registration_id}/revoke")
async def revoke_registration(registration_id: str, user=Depends(get_current_user)):
    organizer_id = user.get("sub") or user.get("user_id")
    return await update_registration_status(
        registration_id=registration_id,
        target_status=RSVPStatus.revoked,
        organizer_id=organizer_id,
    )
