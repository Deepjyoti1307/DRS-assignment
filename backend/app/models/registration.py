from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any, Set

from beanie import Document
from pydantic import BaseModel, Field

from app.models.event import RegistrationMode

class RSVPStatus(str, Enum):
    """
    Registration status state machine.

    Open mode flow:       new → registered
    Shortlisted mode:     new → pending → approved / rejected
    Revoke allowed from:  registered, approved
    """
    new = "new"               # initial state (used only for transition logic)
    pending = "pending"       # awaiting organizer review  (shortlisted mode)
    approved = "approved"     # organizer approved          (shortlisted mode)
    rejected = "rejected"     # organizer rejected          (shortlisted mode)
    registered = "registered" # auto-confirmed              (open mode)
    revoked = "revoked"       # organizer revoked access
    checked_in = "checked_in"


# ── Valid transition map ─────────────────────────────
# Keyed by current_status → set of allowed next statuses
OPEN_TRANSITIONS: Dict[RSVPStatus, Set[RSVPStatus]] = {
    RSVPStatus.new: {RSVPStatus.registered},
    RSVPStatus.registered: {RSVPStatus.revoked, RSVPStatus.checked_in},
    RSVPStatus.checked_in: set(),
}

SHORTLISTED_TRANSITIONS: Dict[RSVPStatus, Set[RSVPStatus]] = {
    RSVPStatus.new: {RSVPStatus.pending},
    RSVPStatus.pending: {RSVPStatus.approved, RSVPStatus.rejected},
    RSVPStatus.approved: {RSVPStatus.revoked, RSVPStatus.checked_in},
    RSVPStatus.rejected: set(),  # terminal
    RSVPStatus.checked_in: set(),
}


class SyncStatus(str, Enum):
    """Tracks whether a registration has been synced to HubSpot."""
    not_synced = "not_synced"
    pending = "pending"
    synced = "synced"
    failed = "failed"


class StatusHistoryItem(BaseModel):
    """Represents a single entry in the registration's audit trail."""
    from_status: Optional[RSVPStatus] = None
    to_status: RSVPStatus
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    changed_by: str = "system"  # User ID or "system"
    reason: Optional[str] = None


class Registration(Document):
    """
    Represents one attendee's registration for a single event.
    Tied to event_id and organizer_id for isolation checks.
    """
    event_id: str                   # ObjectId of the Event (as string)
    organizer_id: str               # organizer who owns the event — denormalized for fast queries
    attendee_email: str
    attendee_name: str
    attendee_phone: Optional[str] = None
    notes: Optional[str] = None
    status: RSVPStatus = RSVPStatus.pending
    status_history: list[StatusHistoryItem] = []
    registration_mode_snapshot: Optional[RegistrationMode] = None
    custom_fields: Optional[Dict[str, Any]] = None   # free-form metadata from registration form

    # ── Check-in ──
    checked_in_at: Optional[datetime] = None

    # ── Integration tracking ──
    sync_status: SyncStatus = SyncStatus.not_synced
    hubspot_contact_id: Optional[str] = None
    hubspot_last_synced_at: Optional[datetime] = None

    # ── Timestamps ──
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "registrations"
