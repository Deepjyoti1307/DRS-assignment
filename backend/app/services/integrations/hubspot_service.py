import asyncio
import logging
import httpx
from datetime import datetime
from typing import Optional
from beanie import PydanticObjectId
from tenacity import retry, stop_after_attempt, wait_exponential
from app.models.registration import Registration, SyncStatus

logger = logging.getLogger(__name__)

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

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    reraise=True
)
async def _perform_hubspot_upsert(
    registration_id: str,
    api_key: str,
    email: str,
    name: str,
    event_title: str,
    status: str,
):
    """
    HubSpot upsert via search + create/update (v3 API does not support /upsert).
    """
    base = "https://api.hubapi.com/crm/v3/objects/contacts"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    first = name.split(" ")[0] if " " in name else name
    last = " ".join(name.split(" ")[1:]) if " " in name else ""
    properties = {
        "email": email,
        "firstname": first,
        "lastname": last,
        "event_name": event_title,
        "rsvp_status": status,
        "rsvp_timestamp": datetime.utcnow().isoformat(),
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1) Search by email
        search_url = f"{base}/search"
        search_payload = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "email",
                            "operator": "EQ",
                            "value": email,
                        }
                    ]
                }
            ]
        }
        search_resp = await client.post(search_url, headers=headers, json=search_payload)

        contact_id = None
        if search_resp.is_success:
            data = search_resp.json()
            if data.get("total", 0) > 0:
                contact_id = data["results"][0]["id"]
        else:
            logger.error(f"[HUBSPOT] Search error: {search_resp.status_code} - {search_resp.text}")
            search_resp.raise_for_status()

        # 2) Create or update
        if contact_id:
            update_url = f"{base}/{contact_id}"
            resp = await client.patch(update_url, headers=headers, json={"properties": properties})
        else:
            create_url = base
            resp = await client.post(create_url, headers=headers, json={"properties": properties})

        reg = await Registration.get(PydanticObjectId(registration_id))
        if not reg:
            return

        if resp.is_success:
            data = resp.json()
            reg.sync_status = SyncStatus.synced
            reg.hubspot_contact_id = data.get("id") or contact_id
            reg.hubspot_last_synced_at = datetime.utcnow()
            await reg.save()
            logger.info(f"[HUBSPOT] Successfully synced {email} for event {event_title}")
        else:
            reg.sync_status = SyncStatus.failed
            await reg.save()
            logger.error(f"[HUBSPOT] API Error: {resp.status_code} - {resp.text}")
            resp.raise_for_status()

async def _sync_registration_to_hubspot(
    registration_id: str,
    organizer_hubspot_key: Optional[str],
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
) -> None:
    if not organizer_hubspot_key:
        return

    # Update status to pending before starting
    reg = await Registration.get(PydanticObjectId(registration_id))
    if reg:
        reg.sync_status = SyncStatus.pending
        await reg.save()

    try:
        await _perform_hubspot_upsert(
            registration_id=registration_id,
            api_key=organizer_hubspot_key,
            email=attendee_email,
            name=attendee_name,
            event_title=event_title,
            status=status,
        )
    except Exception as e:
        logger.error(f"[HUBSPOT] Final failure after retries for {attendee_email}: {str(e)}")
        # Status is already set to failed in _perform_hubspot_upsert try/except or the last attempt

def trigger_hubspot_sync(
    registration_id: str,
    organizer_hubspot_key: Optional[str],
    attendee_email: str,
    attendee_name: str,
    event_title: str,
    status: str,
) -> None:
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
