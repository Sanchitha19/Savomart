import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from database import Base, engine, SessionLocal
from seed import seed_db, seed_admin
from models import User, OTPStore, Coupon, Offer
from models import SupportRequest, PointsTransaction, Admin

# Import Routers
from routers import auth, users, offers, stores, support
import routers.admin as admin_router

app = FastAPI(
    title="Savomart Loyalty API",
    description="Backend services for Savomart grocery loyalty companion app.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup():
    from datetime import datetime, timedelta
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed users + offers if empty
        if db.query(User).count() == 0:
            from seed import seed_db
            seed_db()
            print("Seed data inserted successfully")
        else:
            print(f"Database ready — {db.query(User).count()} users found")

        # Always ensure admin account exists (idempotent)
        seed_admin(db)

        # Seed mock support tickets if empty
        if db.query(SupportRequest).count() == 0:
            from passlib.context import CryptContext
            mock_tickets = [
                SupportRequest(
                    name="Priya Sharma",
                    phone="9999999999",
                    email="priya@test.com",
                    issue_category="Points Issue",
                    description="Points not credited after Rs.800 purchase",
                    status="Open",
                    created_at=datetime.utcnow() - timedelta(hours=1)
                ),
                SupportRequest(
                    name="Rahul Mehta",
                    phone="8888888888",
                    email="rahul@test.com",
                    issue_category="Coupon Issue",
                    description="SAVE50 coupon not applying at checkout",
                    status="InProgress",
                    created_at=datetime.utcnow() - timedelta(hours=3)
                ),
                SupportRequest(
                    name="Anita Patel",
                    phone="7777777777",
                    email="anita@test.com",
                    issue_category="App Issue",
                    description="App crashes on points history page",
                    status="Resolved",
                    created_at=datetime.utcnow() - timedelta(days=1)
                ),
                SupportRequest(
                    name="Vikram Singh",
                    phone="9876543210",
                    email="",
                    issue_category="Store Issue",
                    description="Gold tier not recognized at store",
                    status="Open",
                    created_at=datetime.utcnow() - timedelta(minutes=30)
                ),
                SupportRequest(
                    name="Deepa Krishnan",
                    phone="9123456789",
                    email="deepa@test.com",
                    issue_category="Other",
                    description="Want to transfer points to husband account",
                    status="InProgress",
                    created_at=datetime.utcnow() - timedelta(hours=5)
                ),
            ]
            for t in mock_tickets:
                db.add(t)
            db.commit()
            print(f"Mock support tickets seeded: {len(mock_tickets)} tickets")

        print(
            f"Startup complete — "
            f"Tickets: {db.query(SupportRequest).count()}, "
            f"Users: {db.query(User).count()}"
        )

    except Exception as e:
        print(f"Startup error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

# Enable CORS — include deployed frontend URL from env + local dev origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers with prefix /api
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(offers.router, prefix="/api")
app.include_router(stores.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])

@app.get("/health", tags=["Health"])
def health_check():
    """Simple API health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
