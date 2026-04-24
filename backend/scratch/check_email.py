import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Load env before imports
load_dotenv()

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.email_log import EmailLog

async def check_email_status():
    db_url = os.getenv("DATABASE_URL")
    client = AsyncIOMotorClient(db_url)
    await init_beanie(
        database=client.get_database("eventic"),
        document_models=[EmailLog],
    )

    last_log = await EmailLog.find().sort("-sent_at").first_or_none()
    if last_log:
        print(f"Last Email Log:")
        print(f"  To: {last_log.attendee_email}")
        print(f"  Subject: {last_log.subject}")
        print(f"  Status: {last_log.status}")
        if last_log.error_message:
            print(f"  Error: {last_log.error_message}")
    else:
        print("No email logs found.")

if __name__ == "__main__":
    asyncio.run(check_email_status())
