"""
Savomart JWT Authentication Utilities
---------------------------------------
- SECRET_KEY from env var SAVOMART_JWT_SECRET
  (defaults to dev key — CHANGE IN PRODUCTION)
- Algorithm: HS256
- Token expiry: 7 days (configurable via ACCESS_TOKEN_EXPIRE_MINUTES)

Functions:
  generate_otp()           → random 6-digit string
  create_access_token()    → signed JWT string
  verify_token()           → decoded payload dict, raises 401 on failure
  get_current_user()       → FastAPI dependency returning User ORM object
"""

import os
import random
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models import User

# ── Secret / algorithm config ──────────────────────────────────────────────
SECRET_KEY = os.getenv(
    "SAVOMART_JWT_SECRET",
    "savomart-secret-key-change-in-prod"  # override via env var in production
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# ── OAuth2 scheme — looks for Bearer token in Authorization header ─────────
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/verify-otp",
    auto_error=False,  # allow unauthenticated access on public routes
)


# ─────────────────────────────────────────────────────────
# OTP generation
# ─────────────────────────────────────────────────────────
def generate_otp() -> str:
    """Generate a random 6-digit OTP code as a zero-padded string."""
    return f"{random.randint(0, 999999):06d}"


# ─────────────────────────────────────────────────────────
# Token creation
# ─────────────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a signed JWT token.

    Args:
        data: payload dict — must include 'sub' (phone number)
        expires_delta: optional custom expiry; defaults to ACCESS_TOKEN_EXPIRE_MINUTES

    Returns:
        Signed JWT string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ─────────────────────────────────────────────────────────
# Token verification
# ─────────────────────────────────────────────────────────
def verify_token(token: str) -> dict:
    """
    Decode and verify a JWT token.

    Args:
        token: raw Bearer token string

    Returns:
        Decoded payload dict

    Raises:
        HTTPException 401 if token is missing, malformed, or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone_number: str = payload.get("sub")
        if phone_number is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ─────────────────────────────────────────────────────────
# get_current_user dependency
# ─────────────────────────────────────────────────────────
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: extract and validate the Bearer token,
    then return the corresponding User ORM object.

    Raises HTTPException 401 if token is absent, invalid, or user not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token:
        raise credentials_exception

    payload = verify_token(token)  # raises 401 on failure
    phone_number: str = payload.get("sub")

    user = db.query(User).filter(User.phone_number == phone_number).first()
    if user is None:
        raise credentials_exception

    return user
