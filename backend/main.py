import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from database import Base, engine, SessionLocal
from seed import seed_db
from models import User, OTPStore, Coupon, Offer
from models import SupportRequest, PointsTransaction

# Import Routers
from routers import auth, users, offers, stores, support

app = FastAPI(
    title="Savomart Loyalty API",
    description="Backend services for Savomart grocery loyalty companion app.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            from seed import seed_db
            seed_db()
            print("Seed data inserted successfully")
        else:
            print(f"Database ready — {db.query(User).count()} users found")
    except Exception as e:
        print(f"Startup error: {e}")
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

@app.get("/health", tags=["Health"])
def health_check():
    """Simple API health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
