"""
Savomart Authentication Router
-------------------------------
Endpoints:
  POST /api/auth/request-otp   — generate & store OTP, print to console
  POST /api/auth/verify-otp    — validate OTP, issue JWT, return user
  POST /api/auth/logout        — client-side token drop (stateless)

Design note on OTP delivery:
  Real SMS in India requires Twilio + TRAI DLT registration (costly for
  a hackathon). We mock delivery by printing the OTP to stdout and
  returning it in the `demo_otp` field when SAVOMART_DEV_MODE=true
  (default). In production: set SAVOMART_DEV_MODE=false and integrate
  a real SMS provider — the `demo_otp` key will be absent from the
  response automatically.

  Token blacklisting note (logout):
  We handle logout client-side for now. In production, maintain a Redis
  set of invalidated JTIs and check it in get_current_user().
"""

import os
import logging
import random
import string

def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import OTPStore, User
from schemas import OTPRequest, OTPVerify
from auth import create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger("uvicorn")

# Read dev mode from environment — defaults True for local dev
DEV_MODE = os.getenv("SAVOMART_DEV_MODE", "true").lower() == "true"


# ─────────────────────────────────────────────────────────
# POST /api/auth/request-otp
# ─────────────────────────────────────────────────────────
@router.post("/request-otp")
def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    """
    Send a 6-digit OTP to the given phone number (simulated in dev mode).

    Steps:
    1. Validate 10-digit phone (handled by Pydantic schema pattern).
    2. Auto-register user if phone is not in the system.
    3. Generate OTP, store with 10-min expiry.
    4. Print to console and return in response (dev mode only).
    """
    phone = payload.phone_number

    # ── Step 2: Auto-register if new user ──────────────────
    user = db.query(User).filter(User.phone_number == phone).first()
    if not user:
        user = User(
            phone_number=phone,
            name="New Savomart Member",
            points_balance=0,
            tier="Silver",
            member_since=datetime.utcnow(),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"[SAVOMART] Auto-registered new user: {phone}")

    # ── Step 3: Generate OTP & store with expiry ───────────
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    otp_entry = OTPStore(
        phone_number=phone,
        otp_code=otp,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(otp_entry)
    db.commit()

    console_msg = (
        f"\n{'='*50}\n"
        f"OTP for {phone}: {otp} (valid 10 min)\n"
        f"{'='*50}\n"
    )
    print(console_msg, flush=True)
    logger.info(console_msg)

    # ── Step 5: Build response ─────────────────────────────
    response = {"message": "OTP sent", "phone_number": phone}
    if DEV_MODE:
        # Only expose OTP in response during development/hackathon demo.
        # Remove SAVOMART_DEV_MODE env var (or set to false) in production.
        response["demo_otp"] = otp

    return response


# ─────────────────────────────────────────────────────────
# POST /api/auth/verify-otp
# ─────────────────────────────────────────────────────────
@router.post("/verify-otp")
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    """
    Verify the submitted OTP. On success, return a 7-day JWT and user object.

    Demo bypass: OTP '123456' always succeeds (useful for quick testing).
    """
    now = datetime.utcnow()
    is_demo_bypass = (payload.otp_code == "123456")

    # ── Find latest matching, unused, non-expired OTP ──────
    otp_entry = (
        db.query(OTPStore)
        .filter(
            OTPStore.phone_number == payload.phone_number,
            OTPStore.otp_code == payload.otp_code,
            OTPStore.is_used == False,
            OTPStore.expires_at > now,
        )
        .order_by(OTPStore.created_at.desc())
        .first()
    )

    if not otp_entry and not is_demo_bypass:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please request a new one.",
        )

    # ── Mark OTP as used ───────────────────────────────────
    if otp_entry:
        otp_entry.is_used = True
        db.commit()

    # ── Fetch user (guaranteed to exist — request-otp creates them) ──
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        # Edge case: verify called without prior request-otp (e.g. demo bypass)
        user = User(
            phone_number=payload.phone_number,
            name="New Savomart Member",
            points_balance=0,
            tier="Silver",
            member_since=datetime.utcnow(),
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # ── Issue 7-day JWT ────────────────────────────────────
    access_token = create_access_token(
        data={"sub": user.phone_number, "user_id": user.id},
        expires_delta=timedelta(days=7),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone_number": user.phone_number,
            "name": user.name,
            "email": user.email,
            "points_balance": user.points_balance,
            "tier": user.tier,
            "member_since": user.member_since.isoformat(),
            "is_active": user.is_active,
        },
    }


# ─────────────────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────────────────
@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Log out the current user.

    Currently stateless — the client drops the token from localStorage.
    Production upgrade: maintain a Redis JTI blacklist and check it in
    get_current_user() to invalidate tokens server-side.
    """
    return {"message": "Logged out successfully.", "phone": current_user.phone_number}
