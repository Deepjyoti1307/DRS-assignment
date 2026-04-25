import os
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
from typing import Optional
from app.core.config import get_settings

def _get_fernet() -> Fernet:
    settings = get_settings()

    # Prefer explicit encryption key, then app secret as a fallback.
    secret = settings.encryption_key or settings.app_secret_key

    # Development-only fallback to avoid breaking local demos.
    if not secret and settings.app_env == "development":
        secret = "drs-fallback-secret-key-32-chars-!!"

    if not secret:
        raise RuntimeError("ENCRYPTION_KEY (or APP_SECRET_KEY) must be set in non-development environments")
    
    # Deriving a 32-byte key from the secret
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"drs-salt-123",
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return Fernet(key)

def encrypt_key(plain_text: str) -> str:
    if not plain_text:
        return ""
    f = _get_fernet()
    return f.encrypt(plain_text.encode()).decode()

def decrypt_key(cipher_text: str) -> str:
    if not cipher_text:
        return ""
    try:
        f = _get_fernet()
        return f.decrypt(cipher_text.encode()).decode()
    except Exception:
        # If decryption fails (e.g. key changed), return empty to avoid leaking ciphertext.
        return ""
