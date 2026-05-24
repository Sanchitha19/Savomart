"""
Admin API Router
----------------
Provides endpoints for the Savomart Admin Panel:
  POST /api/admin/login              — email + password → JWT
  GET  /api/admin/stats              — ticket counts by status / category
  GET  /api/admin/tickets            — paginated ticket list with filters
  PUT  /api/admin/tickets/{id}/status — update ticket status
  GET  /api/admin/download-excel     — download support_requests.xlsx

All non-login endpoints require a Bearer token with role="admin".
This auth is COMPLETELY SEPARATE from the customer user auth.
"""

import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Optional

from database import get_db
from models import Admin, SupportRequest
from auth import create_access_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Schemas ────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: str
    password: str


class StatusUpdate(BaseModel):
    status: str


# ── Admin token guard ─────────────────────────────────────────────────────────

def get_admin_payload(authorization: Optional[str] = Header(None)) -> dict:
    """
    Dependency: validates the Bearer token and ensures role == 'admin'.
    Raises 401 if token is missing, invalid, or belongs to a customer.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin authentication required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not an admin token")
    return payload


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login")
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)):
    """Authenticate admin with email + password. Returns JWT with role=admin."""
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not pwd_context.verify(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": str(admin.id),
        "email": admin.email,
        "role": "admin"
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email
        }
    }


@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(get_admin_payload)
):
    """Return ticket counts by status and category breakdown."""
    total = db.query(SupportRequest).count()
    open_count = db.query(SupportRequest).filter(SupportRequest.status == "Open").count()
    in_progress = db.query(SupportRequest).filter(SupportRequest.status == "InProgress").count()
    resolved = db.query(SupportRequest).filter(SupportRequest.status == "Resolved").count()

    today = datetime.utcnow().date()
    today_count = db.query(SupportRequest).filter(
        func.date(SupportRequest.created_at) == today
    ).count()

    categories = db.query(
        SupportRequest.issue_category,
        func.count(SupportRequest.id)
    ).group_by(SupportRequest.issue_category).all()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "today": today_count,
        "categories": [{"category": c[0], "count": c[1]} for c in categories]
    }


@router.get("/tickets")
def get_admin_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    _: dict = Depends(get_admin_payload)
):
    """Paginated, filterable list of all support tickets."""
    query = db.query(SupportRequest)

    if status:
        query = query.filter(SupportRequest.status == status)
    if category:
        query = query.filter(SupportRequest.issue_category == category)
    if search:
        query = query.filter(
            SupportRequest.name.contains(search) |
            SupportRequest.phone.contains(search)
        )

    total = query.count()
    tickets = query.order_by(SupportRequest.created_at.desc()).offset(skip).limit(limit).all()

    year = datetime.utcnow().year
    return {
        "tickets": [
            {
                "id": t.id,
                "ticket_id": f"SAV-{year}-{t.id:03d}",
                "name": t.name,
                "phone": t.phone,
                "email": t.email,
                "issue_category": t.issue_category,
                "description": t.description,
                "status": t.status,
                "created_at": t.created_at.isoformat()
            }
            for t in tickets
        ],
        "total": total,
        "pages": (total + limit - 1) // limit if limit > 0 else 1
    }


@router.put("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(get_admin_payload)
):
    """Update the status of a support ticket (Open / InProgress / Resolved)."""
    valid_statuses = ["Open", "InProgress", "Resolved"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    ticket = db.query(SupportRequest).filter(SupportRequest.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket.status = payload.status
    db.commit()
    return {"message": "Status updated", "status": payload.status}


@router.get("/download-excel")
def download_excel(_: dict = Depends(get_admin_payload)):
    """Download the Excel export of support requests."""
    filepath = "support_requests.xlsx"
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="No support requests have been exported yet")
    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="savomart_support_requests.xlsx"
    )
