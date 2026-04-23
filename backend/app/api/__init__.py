from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.registrations import router as registrations_router

__all__ = ["auth_router", "events_router", "registrations_router"]

