from datetime import datetime
import re
import random
import string
from typing import Optional, Tuple, List

from beanie import PydanticObjectId
from fastapi import HTTPException
from beanie.operators import In

from app.models.event import Event, EventStatus, EventMode, RegistrationMode
from app.models.registration import Registration, RSVPStatus
from app.models.organizer import Organizer

def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return slug or "event"

async def _generate_safe_slug(title: str) -> str:
    """Generate a URL-safe slug with a random suffix for uniqueness."""
    base = _slugify(title)
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}-{suffix}"

async def _count_capacity_consumed(event_id: str) -> int:
    return await Registration.find(
        Registration.event_id == event_id,
        In(Registration.status, [RSVPStatus.registered, RSVPStatus.approved]),
    ).count()

async def get_public_event_by_slug(slug: str) -> Tuple[Event, dict]:
    event = await Event.find(
        Event.slug == slug,
        Event.status != EventStatus.draft
    ).sort("-created_at").first_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    organizer = await Organizer.find_one(Organizer.clerk_user_id == event.organizer_id)
    requires_phone = bool(organizer and organizer.hubspot_api_key)

    availability = {
        "state": "open",
        "capacity": event.capacity,
        "consumed": event.registrations_count,
        "remaining": max(event.capacity - event.registrations_count, 0),
        "requires_phone": requires_phone,
    }

    if event.status == EventStatus.cancelled:
        availability["state"] = "cancelled"
        return event, availability

    if event.status != EventStatus.published:
        raise HTTPException(status_code=404, detail="Event not published")

    if event.date_time.replace(tzinfo=None) <= datetime.utcnow():
        availability["state"] = "closed"
        return event, availability

    if event.registrations_count >= event.capacity:
        availability["state"] = "full"

    return event, availability

async def list_events(user: dict, status: Optional[EventStatus]) -> List[Event]:
    organizer_id = user.get("sub") or user.get("user_id")
    query = Event.find(Event.organizer_id == organizer_id)
    if status:
        query = query.find(Event.status == status)
    return await query.sort("-created_at").to_list()

async def create_event(payload, user: dict) -> Event:
    organizer_id = user.get("sub") or user.get("user_id")
    event = Event(
        organizer_id=organizer_id,
        title=payload.title,
        description=payload.description,
        date_time=payload.date_time,
        mode=payload.mode,
        venue=payload.venue,
        capacity=payload.capacity,
        registration_mode=payload.registration_mode,
        template_used=payload.template_used,
        slug=await _generate_safe_slug(payload.title),
    )
    await event.insert()
    return event

async def get_event_by_id(event_id: str, user: dict) -> Event:
    organizer_id = user.get("sub") or user.get("user_id")
    try:
        oid = PydanticObjectId(event_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    event = await Event.get(oid)
    if not event or event.organizer_id != organizer_id:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

from app.services.email_service import trigger_event_cancelled, trigger_event_updated

async def update_event(event_id: str, payload, user: dict) -> Event:
    event = await get_event_by_id(event_id, user)
    
    # Edit lock
    if event.status == EventStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cancelled events cannot be edited")

    updates = payload.dict(exclude_unset=True)
    for key, value in updates.items():
        if hasattr(event, key):
            setattr(event, key, value)
    
    # Update slug if title changed and still in draft
    if "title" in updates and event.status == EventStatus.draft:
        event.slug = await _generate_safe_slug(event.title)
    
    event.updated_at = datetime.utcnow()
    await event.save()
    
    # Trigger "Event Updated" email for published events
    if event.status == EventStatus.published:
        registrations = await Registration.find(
            Registration.event_id == str(event.id),
            In(Registration.status, [RSVPStatus.pending, RSVPStatus.approved, RSVPStatus.registered]),
        ).to_list()
        for reg in registrations:
            trigger_event_updated(
                registration_id=str(reg.id),
                attendee_email=reg.attendee_email,
                attendee_name=reg.attendee_name,
                event_title=event.title,
            )
            
    return event

async def delete_event(event_id: str, user: dict) -> None:
    event = await get_event_by_id(event_id, user)
    
    # Draft-only deletion
    if event.status != EventStatus.draft:
        raise HTTPException(
            status_code=400, 
            detail=f"Only draft events can be deleted. Status: {event.status}"
        )

    # Cascading delete
    await Registration.find(Registration.event_id == str(event.id)).delete()
    await event.delete()

async def publish_event(event_id: str, user: dict) -> Event:
    event = await get_event_by_id(event_id, user)
    if event.status != EventStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft events can be published")
    
    if event.date_time.replace(tzinfo=None) <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="Event date must be in the future")
        
    if not event.slug:
        event.slug = await _generate_safe_slug(event.title)
        
    event.status = EventStatus.published
    event.updated_at = datetime.utcnow()
    await event.save()
    return event



async def cancel_event(event_id: str, user: dict) -> Event:
    event = await get_event_by_id(event_id, user)
    if event.status == EventStatus.cancelled:
        return event
        
    event.status = EventStatus.cancelled
    event.updated_at = datetime.utcnow()
    await event.save()
    
    # Notify all attendees
    registrations = await Registration.find(
        Registration.event_id == str(event.id),
        In(Registration.status, [RSVPStatus.pending, RSVPStatus.approved, RSVPStatus.registered]),
    ).to_list()
    for reg in registrations:
        trigger_event_cancelled(
            registration_id=str(reg.id),
            attendee_email=reg.attendee_email,
            attendee_name=reg.attendee_name,
            event_title=event.title,
        )
        
    return event


async def duplicate_event(event_id: str, user: dict) -> Event:
    """Clones an existing event into a new draft."""
    source_event = await get_event_by_id(event_id, user)
    
    new_event = Event(
        organizer_id=source_event.organizer_id,
        title=f"Copy of {source_event.title}",
        description=source_event.description,
        date_time=source_event.date_time,
        mode=source_event.mode,
        venue=source_event.venue,
        capacity=source_event.capacity,
        registration_mode=source_event.registration_mode,
        template_used=source_event.template_used,
        image_url=source_event.image_url,
        location_lat=source_event.location_lat,
        location_lng=source_event.location_lng,
        status=EventStatus.draft,
        slug=await _generate_safe_slug(source_event.title),
        registrations_count=0
    )
    
    await new_event.insert()
    return new_event
