from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class EmailLog(Document):
    registration_id: str
    attendee_email: str
    trigger: str
    subject: str
    body: str
    template: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "sent"  # sent, failed
    error_message: Optional[str] = None

    class Settings:
        name = "email_logs"
        indexes = [
            "attendee_email",
            "registration_id",
            "sent_at"
        ]
