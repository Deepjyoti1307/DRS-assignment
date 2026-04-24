from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.services.event_service import get_public_event_by_slug

router = APIRouter(tags=["public"])


@router.get("/e/{slug}")
async def public_event(slug: str):
    event, availability = await get_public_event_by_slug(slug)
    return {
        "event": event,
        "availability": availability,
    }
