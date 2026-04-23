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

async def _upsert_hubspot_contact(
    api_key: str,
    email: str,
    name: str,
    event_title: str,
    status: str,
) -> Optional[str]:
    """
    Stub — Create or update a HubSpot contact.
    Returns the HubSpot contact ID on success, None on failure.

    Replace with real HubSpot API v3 calls:
      POST https://api.hubapi.com/crm/v3/objects/contacts
      PATCH https://api.hubapi.com/crm/v3/objects/contacts/{contactId}
    """
    logger.info(
        f"[HUBSPOT] Upsert contact: {email} | event={event_title} | status={status}"
    )
    # TODO: Implement real HubSpot API call
    # Example:
    #   async with httpx.AsyncClient() as client:
    #       resp = await client.post(
    #           "https://api.hubapi.com/crm/v3/objects/contacts",
    #           headers={"Authorization": f"Bearer {api_key}"},
    #           json={
    #               "properties": {
    #                   "email": email,
    #                   "firstname": name.split()[0] if name else "",
    #                   "lastname": " ".join(name.split()[1:]) if name else "",
    #                   "last_event": event_title,
    #                   "registration_status": status,
    #               }
    #           },
    #       )
    #       return resp.json().get("id")
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
