from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.core.auth import get_current_user
from app.core.config import get_settings
from app.models.organizer import Organizer

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/sync")
async def sync_organizer(user=Depends(get_current_user)):
    clerk_user_id = user.get("sub") or user.get("user_id")
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid Clerk token")

    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_user_id)
    if organizer:
        return organizer

    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.clerk_secret_key}"}
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}", headers=headers
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=400, detail="Unable to fetch Clerk user")
        data = response.json()

    primary_email = None
    if data.get("email_addresses"):
        primary_id = data.get("primary_email_address_id")
        for email in data["email_addresses"]:
            if email.get("id") == primary_id:
                primary_email = email.get("email_address")
                break
        if not primary_email:
            primary_email = data["email_addresses"][0].get("email_address")

    name = " ".join(
        part for part in [data.get("first_name"), data.get("last_name")] if part
    ).strip()

    organizer = Organizer(
        clerk_user_id=clerk_user_id,
        email=primary_email,
        name=name or None,
    )
    await organizer.insert()
    return organizer


@router.get("/me")
async def me(user=Depends(get_current_user)):
    clerk_user_id = user.get("sub") or user.get("user_id")
    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_user_id)
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")
    return organizer
