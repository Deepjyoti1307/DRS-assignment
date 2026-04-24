from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.db import init_db
from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.registrations import router as registrations_router
from app.api.public import router as public_router
from app.api.settings import router as settings_router


def create_app() -> FastAPI:
	settings = get_settings()
	app = FastAPI(title="GoAvo Mini Event Platform")

	app.add_middleware(
		CORSMiddleware,
		allow_origins=[
			settings.frontend_url,
			"http://localhost:3000",
			"http://localhost:3001",
			"http://127.0.0.1:3000"
		],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"]
	)

	app.include_router(auth_router)
	app.include_router(events_router)
	app.include_router(registrations_router)
	app.include_router(public_router)
	app.include_router(settings_router)

	@app.on_event("startup")
	async def on_startup() -> None:
		await init_db()

	return app


app = create_app()
