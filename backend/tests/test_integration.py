import pytest
import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure the backend package is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.organizer import Organizer
from app.models.event import Event, EventMode, EventStatus, RegistrationMode
from app.models.registration import Registration, RSVPStatus
from app.services.registration_service import (
    create_registration,
    update_registration_status,
)
from app.services.event_service import duplicate_event

from unittest.mock import patch
import pytest_asyncio

@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_db():
    db_url = os.getenv("DATABASE_URL")
    client = AsyncIOMotorClient(db_url)
    await init_beanie(
        database=client.get_database("eventic_test"),
        document_models=[Organizer, Event, Registration],
    )
    yield
    await Registration.find_all().delete()
    await Event.find(Event.organizer_id == "test-organizer-001").delete()
    await Organizer.find(Organizer.clerk_user_id == "test-organizer-001").delete()

@pytest.fixture(autouse=True)
def mock_email():
    with patch("app.services.email_service._send_smtp_sync") as mock:
        yield mock

@pytest_asyncio.fixture(scope="function")
async def organizer():
    org = Organizer(
        clerk_user_id="test-organizer-001",
        email="organizer@test.com",
        name="Test Organizer",
    )
    await org.insert()
    return org

@pytest_asyncio.fixture(scope="function")
async def shortlisted_event(organizer):
    event = Event(
        organizer_id=organizer.clerk_user_id,
        title="Integration Test Event",
        description="Testing full flow",
        date_time=datetime.now(timezone.utc) + timedelta(days=7),
        mode=EventMode.offline,
        venue="Test Venue",
        capacity=5,
        registration_mode=RegistrationMode.shortlisted,
        status=EventStatus.published,
    )
    await event.insert()
    return event

@pytest.mark.asyncio
async def test_full_attendee_lifecycle(shortlisted_event, organizer):
    # 1. Register
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="tester@integration.com",
        attendee_name="Tester",
    )
    assert reg.status == RSVPStatus.pending
    
    # 2. Approve
    reg = await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.approved,
        organizer_id=organizer.clerk_user_id
    )
    assert reg.status == RSVPStatus.approved
    
    # 3. Check-in
    reg = await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.checked_in,
        organizer_id=organizer.clerk_user_id
    )
    assert reg.status == RSVPStatus.checked_in
    assert reg.checked_in_at is not None

@pytest.mark.asyncio
async def test_event_duplication_flow(shortlisted_event, organizer):
    user = {"sub": organizer.clerk_user_id}
    
    # Duplicate
    new_event = await duplicate_event(str(shortlisted_event.id), user)
    
    assert new_event.id != shortlisted_event.id
    assert new_event.title == f"Copy of {shortlisted_event.title}"
    assert new_event.status == EventStatus.draft
    assert new_event.registrations_count == 0
    assert new_event.slug != shortlisted_event.slug
