import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.core.config import get_settings
from app.models.event import Event, EventStatus, EventMode, RegistrationMode
from app.models.registration import Registration, RSVPStatus, StatusHistoryItem
from app.models.organizer import Organizer
from app.models.email_log import EmailLog
from app.services.event_service import _generate_safe_slug

async def seed():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.database_url)
    await init_beanie(
        database=client.get_default_database(),
        document_models=[Event, Registration, Organizer, EmailLog]
    )

    print("Cleaning database...")
    # Optional: Clear existing data for a fresh start
    # await Event.find_all().delete()
    # await Registration.find_all().delete()
    # await EmailLog.find_all().delete()

    # 1. Create Sample Organizer
    clerk_id = "user_2f0d6f94_dummy_seed"
    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_id)
    if not organizer:
        organizer = Organizer(
            clerk_user_id=clerk_id,
            email="seed@example.com",
            name="Seed Organizer"
        )
        await organizer.insert()
        print(f"Created organizer: {organizer.name}")

    # 2. Sample Events Data
    event_templates = [
        {
            "title": "Global Tech Summit 2024",
            "description": "The largest gathering of tech enthusiasts and industry leaders.",
            "mode": EventMode.offline,
            "venue": "San Francisco Convention Center",
            "capacity": 500,
            "reg_mode": RegistrationMode.shortlisted
        },
        {
            "title": "AI & Machine Learning Workshop",
            "description": "Hands-on session with the latest ML frameworks and tools.",
            "mode": EventMode.online,
            "venue": "Zoom / Virtual",
            "capacity": 100,
            "reg_mode": RegistrationMode.open
        },
        {
            "title": "Sustainable Future Conference",
            "description": "Exploring innovations in green technology and sustainability.",
            "mode": EventMode.offline,
            "venue": "Berlin Innovation Hub",
            "capacity": 250,
            "reg_mode": RegistrationMode.shortlisted
        },
        {
            "title": "Product Design Masterclass",
            "description": "Deep dive into UX/UI best practices for modern web apps.",
            "mode": EventMode.online,
            "venue": "Google Meet",
            "capacity": 50,
            "reg_mode": RegistrationMode.open
        }
    ]

    print("Seeding events...")
    created_events = []
    for t in event_templates:
        # Check if already exists
        existing = await Event.find_one(Event.title == t["title"], Event.organizer_id == clerk_id)
        if not existing:
            status = random.choice([EventStatus.published, EventStatus.published, EventStatus.draft])
            if "Global" in t["title"]: status = EventStatus.published # Ensure one is always published
            
            event = Event(
                organizer_id=clerk_id,
                title=t["title"],
                description=t["description"],
                date_time=datetime.utcnow() + timedelta(days=random.randint(5, 60)),
                mode=t["mode"],
                venue=t["venue"],
                capacity=t["capacity"],
                registration_mode=t["reg_mode"],
                status=status,
                slug=await _generate_safe_slug(t["title"])
            )
            await event.insert()
            created_events.append(event)
            print(f"Created event: {event.title} ({event.status})")
        else:
            created_events.append(existing)

    # 3. Sample Registrations
    print("Seeding registrations...")
    attendees = [
        ("Alice Johnson", "alice@example.com"),
        ("Bob Smith", "bob@example.com"),
        ("Charlie Brown", "charlie@example.com"),
        ("Diana Prince", "diana@example.com"),
        ("Ethan Hunt", "ethan@example.com"),
        ("Fiona Gallagher", "fiona@example.com"),
        ("George Miller", "george@example.com"),
        ("Hannah Abbott", "hannah@example.com"),
        ("Ian Wright", "ian@example.com"),
        ("Julia Roberts", "julia@example.com")
    ]

    for event in created_events:
        if event.status == EventStatus.draft:
            continue
            
        # Seed 5-10 registrations per published event
        num_regs = random.randint(3, 8)
        selected_attendees = random.sample(attendees, num_regs)
        
        for name, email in selected_attendees:
            # Check if exists
            existing_reg = await Registration.find_one(
                Registration.event_id == str(event.id),
                Registration.attendee_email == email
            )
            if not existing_reg:
                status = random.choice([RSVPStatus.pending, RSVPStatus.approved, RSVPStatus.registered, RSVPStatus.checked_in])
                if event.registration_mode == RegistrationMode.open:
                    status = random.choice([RSVPStatus.registered, RSVPStatus.checked_in, RSVPStatus.revoked])
                else:
                    status = random.choice([RSVPStatus.pending, RSVPStatus.approved, RSVPStatus.rejected])

                reg = Registration(
                    event_id=str(event.id),
                    organizer_id=clerk_id,
                    attendee_email=email,
                    attendee_name=name,
                    attendee_phone=f"+1{random.randint(1000000000, 9999999999)}",
                    status=status,
                    status_history=[StatusHistoryItem(
                        from_status=None,
                        to_status=status,
                        changed_by="system"
                    )],
                    registration_mode_snapshot=event.registration_mode,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(0, 4))
                )
                
                if status == RSVPStatus.checked_in:
                    reg.checked_in_at = reg.created_at + timedelta(hours=random.randint(1, 24))
                
                await reg.insert()
                
                # Update event registrations_count if consuming capacity
                if status in [RSVPStatus.registered, RSVPStatus.approved, RSVPStatus.checked_in]:
                    event.registrations_count += 1
                    await event.save()
                    
        print(f"Added {num_regs} registrations to '{event.title}'")

    print("\nDatabase seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
