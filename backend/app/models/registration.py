from datetime import datetime
from enum import Enum
from typing import Optional, Dict, Any

from beanie import Document
from pydantic import BaseModel, Field


class RSVPStatus(str, Enum):
    """
    Registration status state machine.

    Open mode flow:       new → registered
    Shortlisted mode:     new → pending → approved / rejected
    Revoke allowed from:  registered, approved
    """
    new = "new"               # initial state (never persisted — used only for transition logic)
    pending = "pending"       # awaiting organizer review  (shortlisted mode)
    approved = "approved"     # organizer approved          (shortlisted mode)
    rejected = "rejected"     # organizer rejected          (shortlisted mode)
    registered = "registered" # auto-confirmed              (open mode)
    revoked = "revoked"       # organizer revoked access


# ── Valid transition map ─────────────────────────────
# Keyed by (current_status, registration_mode) → set of allowed next statuses
OPEN_TRANSITIONS: Dict[RSVPStatus, set] = {
    RSVPStatus.registered: {RSVPStatus.revoked},
}

SHORTLISTED_TRANSITIONS: Dict[RSVPStatus, set] = {
    RSVPStatus.pending:  {RSVPStatus.approved, RSVPStatus.rejected},
    RSVPStatus.approved: {RSVPStatus.revoked},
    RSVPStatus.rejected: set(),  # terminal
}


class SyncStatus(str, Enum):
    """Tracks whether a registration has been synced to HubSpot."""
    not_synced = "not_synced"
    synced = "synced"
    failed = "failed"


class Registration(Document):
    """
    Represents one attendee's registration for a single event.
    Tied to event_id and organizer_id for isolation checks.
    """
    event_id: str                   # ObjectId of the Event (as string)
    organizer_id: str               # organizer who owns the event — denormalized for fast queries
    attendee_email: str
    attendee_name: str
    status: RSVPStatus = RSVPStatus.pending
    custom_fields: Optional[Dict[str, Any]] = None   # free-form metadata from registration form

    # ── Integration tracking ──
    sync_status: SyncStatus = SyncStatus.not_synced
    hubspot_contact_id: Optional[str] = None

    # ── Timestamps ──
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "registrations"
