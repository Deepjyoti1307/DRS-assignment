import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import get_settings
from app.models.event import Event
from beanie import init_beanie

async def main():
    settings = get_settings()
    client = AsyncIOMotorClient(settings.database_url)
    await init_beanie(database=client.get_default_database(), document_models=[Event])
    
    events = await Event.find_all().to_list()
    print("Found", len(events), "events")
    for e in events:
        print(f"Title: {e.title}, Slug: {e.slug}, Status: {e.status}")

if __name__ == "__main__":
    asyncio.run(main())
