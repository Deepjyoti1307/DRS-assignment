"""
Registration System — Sanity Checks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Tests against the real MongoDB (eventic-cluster).
Covers: open mode, shortlisted mode, transitions, capacity, duplicates.

Run:  cd backend && python -m pytest tests/test_registration.py -v
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

# Ensure the backend package is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.models.organizer import Organizer
from app.models.event import Event, EventMode, EventStatus, RegistrationMode
from app.models.registration import Registration, RSVPStatus
from app.services.registration_service import (
    create_registration,
    list_registrations,
    update_registration_status,
)
from fastapi import HTTPException


import pytest_asyncio
from unittest.mock import patch


# ── Fixtures ─────────────────────────────────────────

@pytest.fixture(autouse=True)
def mock_email():
    with patch("app.services.email_service._send_smtp_sync") as mock:
        yield mock

@pytest_asyncio.fixture(scope="function", autouse=True)
async def init_db():
    """Connect to real MongoDB and init Beanie once for all tests."""
    db_url = os.getenv("DATABASE_URL")
    assert db_url, "DATABASE_URL not set in .env"
    client = AsyncIOMotorClient(db_url)
    await init_beanie(
        database=client.get_database("eventic_test"),
        document_models=[Organizer, Event, Registration],
    )
    yield
    # Cleanup test data after all tests
    await Registration.find_all().delete()
    await Event.find(Event.organizer_id == "test-organizer-001").delete()
    await Organizer.find(Organizer.clerk_user_id == "test-organizer-001").delete()


@pytest_asyncio.fixture(scope="function")
async def organizer():
    """Create a test organizer."""
    # Ensure clean state for each test if using function scope
    await Organizer.find(Organizer.clerk_user_id == "test-organizer-001").delete()
    org = Organizer(
        clerk_user_id="test-organizer-001",
        email="organizer@test.com",
        name="Test Organizer",
    )
    await org.insert()
    return org


@pytest_asyncio.fixture(scope="function")
async def open_event(organizer):
    """Create a published event with OPEN registration mode, capacity 3."""
    event = Event(
        organizer_id=organizer.clerk_user_id,
        title="Open Mode Test Event",
        description="Testing open registration",
        date_time=datetime.utcnow() + timedelta(days=7),
        mode=EventMode.online,
        venue="Online",
        capacity=3,
        registration_mode=RegistrationMode.open,
        status=EventStatus.published,
    )
    await event.insert()
    return event


@pytest_asyncio.fixture(scope="function")
async def shortlisted_event(organizer):
    """Create a published event with SHORTLISTED registration mode, capacity 2."""
    event = Event(
        organizer_id=organizer.clerk_user_id,
        title="Shortlisted Mode Test Event",
        description="Testing shortlisted registration",
        date_time=datetime.now(timezone.utc) + timedelta(days=7),
        mode=EventMode.offline,
        venue="Test Venue",
        capacity=2,
        registration_mode=RegistrationMode.shortlisted,
        status=EventStatus.published,
    )
    await event.insert()
    return event


# ═══════════════════════════════════════════════════════
#  TEST 1: Register in OPEN mode → auto "registered"
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_open_mode_registration(open_event):
    reg = await create_registration(
        event_id=str(open_event.id),
        attendee_email="alice@test.com",
        attendee_name="Alice",
    )
    assert reg.status == RSVPStatus.registered
    assert reg.event_id == str(open_event.id)
    print(f"  ✅ Open mode → status={reg.status.value}")


# ═══════════════════════════════════════════════════════
#  TEST 2: Register in SHORTLISTED mode → "pending"
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_shortlisted_mode_registration(shortlisted_event):
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="bob@test.com",
        attendee_name="Bob",
    )
    assert reg.status == RSVPStatus.pending
    print(f"  ✅ Shortlisted mode → status={reg.status.value}")


# ═══════════════════════════════════════════════════════
#  TEST 3: Approve a pending registration
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_approve_registration(shortlisted_event):
    # Create a fresh registration
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="charlie@test.com",
        attendee_name="Charlie",
    )
    assert reg.status == RSVPStatus.pending

    # Approve it
    updated = await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.approved,
        organizer_id=shortlisted_event.organizer_id,
    )
    assert updated.status == RSVPStatus.approved
    print(f"  ✅ Approve: pending → {updated.status.value}")


# ═══════════════════════════════════════════════════════
#  TEST 4: Reject a pending registration
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_reject_registration(shortlisted_event):
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="dave@test.com",
        attendee_name="Dave",
    )
    updated = await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.rejected,
        organizer_id=shortlisted_event.organizer_id,
    )
    assert updated.status == RSVPStatus.rejected
    print(f"  ✅ Reject: pending → {updated.status.value}")


# ═══════════════════════════════════════════════════════
#  TEST 5: Revoke an approved registration
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_revoke_approved(shortlisted_event):
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="eve@test.com",
        attendee_name="Eve",
    )
    # Approve first
    await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.approved,
        organizer_id=shortlisted_event.organizer_id,
    )
    # Then revoke
    updated = await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.revoked,
        organizer_id=shortlisted_event.organizer_id,
    )
    assert updated.status == RSVPStatus.revoked
    print(f"  ✅ Revoke: approved → {updated.status.value}")


# ═══════════════════════════════════════════════════════
#  TEST 6: Invalid transition → 422
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_invalid_transition(shortlisted_event):
    reg = await create_registration(
        event_id=str(shortlisted_event.id),
        attendee_email="frank@test.com",
        attendee_name="Frank",
    )
    # Reject first
    await update_registration_status(
        registration_id=str(reg.id),
        target_status=RSVPStatus.rejected,
        organizer_id=shortlisted_event.organizer_id,
    )
    # Try to approve a rejected registration → should fail
    with pytest.raises(HTTPException) as exc_info:
        await update_registration_status(
            registration_id=str(reg.id),
            target_status=RSVPStatus.approved,
            organizer_id=shortlisted_event.organizer_id,
        )
    assert exc_info.value.status_code == 422
    print(f"  ✅ Invalid transition blocked with 422")


# ═══════════════════════════════════════════════════════
#  TEST 7: Capacity enforcement → 409
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_capacity_enforcement(open_event):
    # open_event has capacity=3. Let's fill it.
    for i in range(3):
        await create_registration(
            event_id=str(open_event.id),
            attendee_email=f"user{i}@test.com",
            attendee_name=f"User {i}",
        )

    # 4th registration should be blocked
    with pytest.raises(HTTPException) as exc_info:
        await create_registration(
            event_id=str(open_event.id),
            attendee_email="overflow@test.com",
            attendee_name="Overflow",
        )
    assert exc_info.value.status_code == 409
    assert "full" in exc_info.value.detail.lower()
    print(f"  ✅ Capacity enforcement: blocked at {open_event.capacity}/{open_event.capacity}")


# ═══════════════════════════════════════════════════════
#  TEST 8: Duplicate prevention → 409
# ═══════════════════════════════════════════════════════

@pytest.mark.asyncio
async def test_duplicate_prevention(open_event):
    # Register first time
    await create_registration(
        event_id=str(open_event.id),
        attendee_email="duplicate@test.com",
        attendee_name="First Timer",
    )
    
    # Register second time
    with pytest.raises(HTTPException) as exc_info:
        await create_registration(
            event_id=str(open_event.id),
            attendee_email="duplicate@test.com",
            attendee_name="Second Timer",
        )
    assert exc_info.value.status_code == 409
    assert "already registered" in exc_info.value.detail.lower()
    print(f"  ✅ Duplicate prevention: blocked")
