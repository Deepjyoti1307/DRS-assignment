from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings
from app.models.organizer import Organizer
from app.models.event import Event


async def init_db() -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(settings.database_url)
    await init_beanie(database=client.get_default_database(), document_models=[Organizer, Event])
