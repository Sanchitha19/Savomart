import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from database import Base, engine, SessionLocal
from seed import seed_db
from models import User

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
    print("Database tables created", flush=True)
    db = SessionLocal()
    if db.query(User).count() == 0:
        seed_db()
    db.close()

# Enable CORS — include deployed frontend URL from env + local dev origins
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

origins = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",  # default Vite port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
