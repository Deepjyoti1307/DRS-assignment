from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import init_db
from app.api.auth import router as auth_router
from app.api.events import router as events_router


def create_app() -> FastAPI:
	settings = get_settings()
	app = FastAPI(title="GoAvo Mini Event Platform")

	app.add_middleware(
		CORSMiddleware,
		allow_origins=[settings.frontend_url],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"]
	)

	app.include_router(auth_router)
	app.include_router(events_router)

	@app.on_event("startup")
	async def on_startup() -> None:
		await init_db()

	return app


app = create_app()
