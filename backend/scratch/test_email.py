import os
import asyncio
from dotenv import load_dotenv

# Load env before imports
load_dotenv()

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.email_log import EmailLog
from app.services.email_service import trigger_registration_received

async def test_real_email():
    print("Initializing DB...")
    db_url = os.getenv("DATABASE_URL")
    client = AsyncIOMotorClient(db_url)
    await init_beanie(
        database=client.get_database("eventic"),
        document_models=[EmailLog],
    )

    print("Triggering real email via registration flow...")
    
    # This will trigger a fire-and-forget task
    trigger_registration_received(
        registration_id="test-reg-id",
        attendee_email="dipudey351@gmail.com",
        attendee_name="Deepjyoti (Test)",
        event_title="SMTP Production Verification",
        status="registered"
    )
    
    print("Task dispatched. Waiting a few seconds for delivery...")
    await asyncio.sleep(5)
    print("Done. Please check your inbox (dipudey351@gmail.com).")

if __name__ == "__main__":
    asyncio.run(test_real_email())
