from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.models.event import Event, EventMode, EventStatus, RegistrationMode
from app.services.event_service import (
    create_event,
    delete_draft_event,
    get_event_by_id,
    list_events,
    publish_event,
    update_event,
    cancel_event,
)

router = APIRouter(prefix="/api/events", tags=["events"])


class EventCreate(BaseModel):
    title: str = Field(..., max_length=200)
    description: str
    date_time: datetime
    mode: EventMode
    venue: str
    capacity: int = Field(..., ge=1)
    registration_mode: RegistrationMode
    template_used: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    date_time: Optional[datetime] = None
    mode: Optional[EventMode] = None
    venue: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    registration_mode: Optional[RegistrationMode] = None
    template_used: Optional[str] = None


@router.get("")
async def get_events(
    status: Optional[EventStatus] = Query(None),
    user=Depends(get_current_user),
):
    return await list_events(user, status)


@router.post("")
async def create(event: EventCreate, user=Depends(get_current_user)):
    return await create_event(event, user)


@router.get("/{event_id}")
async def get_event(event_id: str, user=Depends(get_current_user)):
    return await get_event_by_id(event_id, user)


@router.patch("/{event_id}")
async def update_event_handler(event_id: str, payload: EventUpdate, user=Depends(get_current_user)):
    return await update_event(event_id, payload, user)


@router.delete("/{event_id}")
async def delete_event_handler(event_id: str, user=Depends(get_current_user)):
    await delete_draft_event(event_id, user)
    return {"status": "deleted"}


@router.patch("/{event_id}/publish")
async def publish_event_handler(event_id: str, user=Depends(get_current_user)):
    return await publish_event(event_id, user)


@router.patch("/{event_id}/cancel")
async def cancel_event_handler(event_id: str, user=Depends(get_current_user)):
    return await cancel_event(event_id, user)
