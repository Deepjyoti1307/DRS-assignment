from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient

from app.core.config import get_settings

# Note: In production, you would use a package like PyJWT with Clerk's public key
# or an official clerk-sdk-python to verify the token properly.

security = HTTPBearer()

def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency to verify the Clerk JWT token from the Authorization header.
    This ensures that the backend handles all API authentication.
    """
    token = credentials.credentials
    
    settings = get_settings()
    try:
        jwk_client = PyJWKClient(settings.clerk_jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        unverified = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss")
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
        return decoded
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
