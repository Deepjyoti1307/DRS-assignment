from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class Organizer(Document):
    clerk_user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    hubspot_api_key: Optional[str] = None  # Stored encrypted via app.core.security
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "organizers"
