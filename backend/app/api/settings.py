from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.auth import get_current_user
from app.models.organizer import Organizer
from app.services.registration_service import sync_all_to_hubspot
from app.core.security import encrypt_key, decrypt_key

router = APIRouter(tags=["settings"])

class SettingsResponse(BaseModel):
    clerk_user_id: str
    email: Optional[str]
    name: Optional[str]
    hubspot_api_key_masked: Optional[str]
    has_hubspot_key: bool

class SettingsUpdate(BaseModel):
    name: Optional[str] = None
    hubspot_api_key: Optional[str] = None

def mask_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    try:
        decrypted = decrypt_key(key)
        if len(decrypted) <= 8:
            return "*******"
        return f"{decrypted[:4]}********{decrypted[-4:]}"
    except:
        return "*******"

@router.get("/api/settings", response_model=SettingsResponse)
async def get_settings(user=Depends(get_current_user)):
    clerk_id = user.get("sub") or user.get("user_id")
    email = user.get("email") or user.get("primary_email_address")
    
    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_id)
    
    if not organizer:
        organizer = Organizer(
            clerk_user_id=clerk_id,
            email=email,
            name=user.get("name", "Organizer")
        )
        await organizer.insert()
    
    return SettingsResponse(
        clerk_user_id=organizer.clerk_user_id,
        email=organizer.email,
        name=organizer.name,
        hubspot_api_key_masked=mask_key(organizer.hubspot_api_key),
        has_hubspot_key=bool(organizer.hubspot_api_key)
    )

@router.patch("/api/settings", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdate, user=Depends(get_current_user)):
    clerk_id = user.get("sub") or user.get("user_id")
    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_id)
    
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")
    
    if payload.name is not None:
        organizer.name = payload.name
    
    if payload.hubspot_api_key is not None:
        if payload.hubspot_api_key.strip() == "":
            organizer.hubspot_api_key = None
        else:
            organizer.hubspot_api_key = encrypt_key(payload.hubspot_api_key)
            
    organizer.updated_at = datetime.utcnow()
    await organizer.save()
    
    return SettingsResponse(
        clerk_user_id=organizer.clerk_user_id,
        email=organizer.email,
        name=organizer.name,
        hubspot_api_key_masked=mask_key(organizer.hubspot_api_key),
        has_hubspot_key=bool(organizer.hubspot_api_key)
    )

@router.patch("/api/settings/hubspot")
async def update_hubspot_key(payload: SettingsUpdate, user=Depends(get_current_user)):
    """Explicit endpoint for updating HubSpot key as per PRD."""
    return await update_settings(payload, user)

@router.delete("/api/settings/hubspot")
async def delete_hubspot_key(user=Depends(get_current_user)):
    """Disconnect HubSpot integration."""
    clerk_id = user.get("sub") or user.get("user_id")
    organizer = await Organizer.find_one(Organizer.clerk_user_id == clerk_id)
    if organizer:
        organizer.hubspot_api_key = None
        organizer.updated_at = datetime.utcnow()
        await organizer.save()
    return {"status": "success"}

@router.post("/api/integrations/hubspot/sync")
async def trigger_bulk_sync(user=Depends(get_current_user)):
    organizer_id = user.get("sub") or user.get("user_id")
    return await sync_all_to_hubspot(organizer_id)
