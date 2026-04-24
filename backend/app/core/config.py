from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_secret_key: str = ""
    frontend_url: str = "http://localhost:3000"
    database_url: str
    clerk_secret_key: str
    clerk_jwks_url: str = "https://bursting-halibut-38.clerk.accounts.dev/.well-known/jwks.json"
    
    # SMTP Settings
    email_provider: str = "smtp"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    from_email: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
