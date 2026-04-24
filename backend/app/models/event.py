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
    organizer_id: str
    title: str
    description: str
    date_time: datetime
    mode: EventMode
    venue: str
    capacity: int
    registration_mode: RegistrationMode
    status: EventStatus = EventStatus.draft
    template_used: Optional[str] = None
    slug: Optional[str] = None
    image_url: Optional[str] = None
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "events"
