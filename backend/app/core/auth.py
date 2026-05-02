from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient
import httpx
import threading

from app.core.config import get_settings

# Note: In production, you would use a package like PyJWT with Clerk's public key
# or an official clerk-sdk-python to verify the token properly.

security = HTTPBearer()

def _touch_clerk_session_worker(session_id: str) -> None:
    settings = get_settings()
    if not settings.clerk_touch_sessions or not settings.clerk_secret_key or not session_id:
        return

    try:
        url = f"https://api.clerk.com/v1/sessions/{session_id}/touch"
        headers = {"Authorization": f"Bearer {settings.clerk_secret_key}"}
        with httpx.Client(timeout=2.0) as client:
            response = client.post(url, headers=headers)
            if response.status_code >= 400:
                print(f"Clerk session touch failed: {response.status_code} {response.text}")
    except Exception:
        # Best-effort only; never block auth
        return


def _touch_clerk_session(session_id: str) -> None:
    # Never block request auth path on session TTL extension.
    thread = threading.Thread(target=_touch_clerk_session_worker, args=(session_id,), daemon=True)
    thread.start()

def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency to verify the Clerk JWT token from the Authorization header.
    This ensures that the backend handles all API authentication.
    """
    token = credentials.credentials
    
    settings = get_settings()
    try:
        jwk_client = PyJWKClient(settings.resolved_clerk_jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        decode_kwargs = {
            "algorithms": ["RS256"],
            "issuer": settings.resolved_clerk_issuer,
        }
        if settings.clerk_audience:
            decode_kwargs["audience"] = settings.clerk_audience
            decode_kwargs["options"] = {"verify_aud": True}
        else:
            decode_kwargs["options"] = {"verify_aud": False}

        decoded = jwt.decode(token, signing_key.key, **decode_kwargs)

        # Clerk token hardening: verify authorized party when present.
        expected_azp = settings.resolved_authorized_party
        token_azp = (decoded.get("azp") or "").rstrip("/")
        if token_azp and expected_azp and token_azp != expected_azp:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        session_id = decoded.get("sid") or decoded.get("session_id")
        if session_id:
            _touch_clerk_session(session_id)
        return decoded
    except HTTPException:
        raise
    except Exception as e:
        print(f"JWT Verification Error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

def get_current_user(request: Request, user_data: dict = Security(verify_clerk_token)):
    """
    Dependency to get the current authenticated user.
    """
    return user_data
