from datetime import datetime
import re
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models.event import Event, EventStatus, EventMode, RegistrationMode


def _slugify(text: str) -> str:
	slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
	return slug or "event"


async def list_events(user: dict, status: Optional[EventStatus]):
	organizer_id = user.get("sub") or user.get("user_id")
	query = Event.find(Event.organizer_id == organizer_id)
	if status:
		query = query.find(Event.status == status)
	return await query.sort("-created_at").to_list()


async def create_event(payload, user: dict):
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
		slug=_slugify(payload.title),
	)
	await event.insert()
	return event


async def get_event_by_id(event_id: str, user: dict):
	organizer_id = user.get("sub") or user.get("user_id")
	event = await Event.get(PydanticObjectId(event_id))
	if not event or event.organizer_id != organizer_id:
		raise HTTPException(status_code=404, detail="Event not found")
	return event


async def update_event(event_id: str, payload, user: dict):
	event = await get_event_by_id(event_id, user)
	updates = payload.dict(exclude_unset=True)
	if updates:
		updates["updated_at"] = datetime.utcnow()
	for key, value in updates.items():
		setattr(event, key, value)
	await event.save()
	return event


async def delete_draft_event(event_id: str, user: dict):
	event = await get_event_by_id(event_id, user)
	if event.status != EventStatus.draft:
		raise HTTPException(status_code=400, detail="Only draft events can be deleted")
	await event.delete()


async def publish_event(event_id: str, user: dict):
	event = await get_event_by_id(event_id, user)
	if event.status != EventStatus.draft:
		raise HTTPException(status_code=400, detail="Only draft events can be published")
	if event.date_time <= datetime.utcnow():
		raise HTTPException(status_code=400, detail="Event date must be in the future")
	event.status = EventStatus.published
	event.updated_at = datetime.utcnow()
	await event.save()
	return event


async def cancel_event(event_id: str, user: dict):
	event = await get_event_by_id(event_id, user)
	if event.status == EventStatus.cancelled:
		return event
	if event.status not in {EventStatus.draft, EventStatus.published}:
		raise HTTPException(status_code=400, detail="Event cannot be cancelled")
	event.status = EventStatus.cancelled
	event.updated_at = datetime.utcnow()
	await event.save()
	return event
