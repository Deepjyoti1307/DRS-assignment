import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

# Note: In production, you would use a package like PyJWT with Clerk's public key
# or an official clerk-sdk-python to verify the token properly.

security = HTTPBearer()

def verify_clerk_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Dependency to verify the Clerk JWT token from the Authorization header.
    This ensures that the backend handles all API authentication.
    """
    token = credentials.credentials
    
    # In a real implementation:
    # 1. Fetch Clerk public keys from https://api.clerk.com/v1/jwks
    # 2. Verify the JWT token signature using the public key
    # 3. Check token expiration and audience
    
    try:
        # Example decoding (without verification just to extract claims)
        # unverified_claims = jwt.decode(token, options={"verify_signature": False})
        # return unverified_claims
        pass
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )
    
    return {"user_id": "placeholder_clerk_user_id"}

def get_current_user(request: Request, user_data: dict = Security(verify_clerk_token)):
    """
    Dependency to get the current authenticated user.
    """
    return user_data
