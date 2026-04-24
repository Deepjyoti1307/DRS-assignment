from datetime import datetime
from enum import Enum
from typing import Optional

from beanie import Document
from pydantic import Field


class EventMode(str, Enum):
    online = "online"
    offline = "offline"


class RegistrationMode(str, Enum):
    open = "open"
    shortlisted = "shortlisted"


class EventStatus(str, Enum):
    draft = "draft"
    published = "published"
    cancelled = "cancelled"


class Event(Document):
    """
    Represents an event created by an organizer.
    """
    organizer_id: str               # link to Organizer.clerk_user_id
    title: str
    description: str
    date_time: datetime
    mode: EventMode
    venue: str                      # Physical address or "Online"
    capacity: int
    registrations_count: int = 0    # Tracks approved/registered attendees for atomic checks
    registration_mode: RegistrationMode = RegistrationMode.open
    template_used: Optional[str] = None
    status: EventStatus = EventStatus.draft
    slug: Optional[str] = None
    image_url: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "events"
