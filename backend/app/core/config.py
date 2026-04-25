from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_secret_key: str = ""
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = ""
    database_url: str
    clerk_secret_key: str
    clerk_issuer: str = ""
    clerk_jwks_url: str = ""
    clerk_audience: str = ""
    clerk_authorized_party: str = ""
    encryption_key: str = ""
    
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

    @property
    def resolved_clerk_jwks_url(self) -> str:
        if self.clerk_jwks_url:
            return self.clerk_jwks_url
        if self.clerk_issuer:
            return f"{self.clerk_issuer.rstrip('/')}/.well-known/jwks.json"
        # Local dev fallback for this workspace's Clerk instance.
        return "https://bursting-halibut-38.clerk.accounts.dev/.well-known/jwks.json"

    @property
    def resolved_clerk_issuer(self) -> str:
        if self.clerk_issuer:
            return self.clerk_issuer.rstrip("/")
        jwks = self.resolved_clerk_jwks_url
        suffix = "/.well-known/jwks.json"
        if jwks.endswith(suffix):
            return jwks[: -len(suffix)]
        return jwks.rstrip("/")

    @property
    def resolved_authorized_party(self) -> str:
        if self.clerk_authorized_party:
            return self.clerk_authorized_party.rstrip("/")
        return self.frontend_url.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        configured = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        if self.frontend_url and self.frontend_url not in configured:
            configured.append(self.frontend_url)

        if self.app_env == "development":
            dev_defaults = [
                "http://localhost:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3000",
            ]
            for origin in dev_defaults:
                if origin not in configured:
                    configured.append(origin)

        return configured


@lru_cache()
def get_settings() -> Settings:
    return Settings()
