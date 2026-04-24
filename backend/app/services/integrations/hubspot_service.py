"""
HubSpot Integration Service
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Non-blocking sync hooks for registration lifecycle events.
Isolated from core flow — if HubSpot is down or unconfigured, registrations still work.

Replace the stub methods with real HubSpot API calls when ready.
"""

import asyncio
import logging
from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId

logger = logging.getLogger(__name__)


# ── Non-blocking wrapper (same pattern as email_service) ──

def _fire_and_forget(coro):
    """Schedule background work. Failures are logged, never raised."""
    async def _wrapped():
        try:
            await coro
        except Exception:
            logger.exception("[HUBSPOT] Background sync task failed (non-blocking)")

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_wrapped())
    except RuntimeError:
        logger.warning("[HUBSPOT] No running event loop — skipping sync")


# ── HubSpot API stubs ───────────────────────────────

import httpx

async def _upsert_hubspot_contact(
    api_key: str,
    email: str,
    name: str,
    event_title: str,
    status: str,
) -> Optional[str]:
    """
    Search for a contact by email. If found, update it. If not, create it.
    Returns the HubSpot contact ID on success, None on failure.
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Split name into first/last
    name_parts = name.split()
    first_name = name_parts[0] if name_parts else ""
    last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. Search for contact
            search_url = "https://api.hubapi.com/crm/v3/objects/contacts/search"
            search_payload = {
                "filterGroups": [
                    {
                        "filters": [
                            {
                                "propertyName": "email",
                                "operator": "EQ",
                                "value": email
                            }
                        ]
                    }
                ]
            }
            
            search_resp = await client.post(search_url, headers=headers, json=search_payload)
            search_data = search_resp.json()
            
            contact_id = None
            if search_resp.status_code == 200 and search_data.get("total", 0) > 0:
                contact_id = search_data["results"][0]["id"]

            properties = {
                "email": email,
                "firstname": first_name,
                "lastname": last_name,
                "last_event_registered": event_title,
                "registration_status": status,
            }

            if contact_id:
                # 2. Update existing
                update_url = f"https://api.hubapi.com/crm/v3/objects/contacts/{contact_id}"
                await client.patch(update_url, headers=headers, json={"properties": properties})
                return contact_id
            else:
                # 3. Create new
                create_url = "https://api.hubapi.com/crm/v3/objects/contacts"
                create_resp = await client.post(create_url, headers=headers, json={"properties": properties})
                if create_resp.status_code in (201, 200):
                    return create_resp.json().get("id")
                
            return None
        except Exception as e:
            logger.error(f"[HUBSPOT] API Error: {str(e)}")
            return None


# ── Sync status updater ─────────────────────────────

async def _update_sync_status(
    registration_id: str,
    hubspot_contact_id: Optional[str],
) -> None:
    """Update the registration's sync tracking fields."""
    from app.models.registration import Registration, SyncStatus

    reg = await Registration.get(PydanticObjectId(registration_id))
    if not reg:
        return

    if hubspot_contact_id:
        reg.sync_status = SyncStatus.synced
        reg.hubspot_contact_id = hubspot_contact_id
    else:
        reg.sync_status = SyncStatus.failed

    reg.updated_at = datetime.utcnow()
    await reg.save()


# ── Internal sync orchestrator ───────────────────────

async def _sync_registration_to_hubspot(
    registration_id: str,
    organizer_hubspot_key: Optional[str],
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
) -> None:
    """
    Full sync flow:
    1. Check if organizer has a HubSpot API key configured.
    2. Upsert the contact in HubSpot.
    3. Update the registration's sync_status accordingly.
    """
    if not organizer_hubspot_key:
        logger.debug(f"[HUBSPOT] Organizer has no HubSpot key — skipping sync for {registration_id}")
        return

    contact_id = await _upsert_hubspot_contact(
        api_key=organizer_hubspot_key,
        email=attendee_email,
        name=attendee_name,
        event_title=event_title,
        status=status,
    )
    await _update_sync_status(registration_id, contact_id)


# ═══════════════════════════════════════════════════════
#  Public triggers — called from registration_service
# ═══════════════════════════════════════════════════════

def trigger_hubspot_sync(
    registration_id: str,
    organizer_hubspot_key: Optional[str],
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
) -> None:
    """
    Fire-and-forget HubSpot sync after any registration status change.
    Safe to call even if organizer has no HubSpot key — it will no-op.
    """
    _fire_and_forget(
        _sync_registration_to_hubspot(
            registration_id=registration_id,
            organizer_hubspot_key=organizer_hubspot_key,
            attendee_email=attendee_email,
            attendee_name=attendee_name,
            event_title=event_title,
            status=status,
        )
    )
