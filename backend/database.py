import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use /data directory on Render for persistence
# Falls back to local savomart.db for development
DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./savomart.db")

# Create engine (SQLite requires check_same_thread=False for multithreading)
engine = create_engine(
    DB_PATH, connect_args={"check_same_thread": False}
)

# Session local factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
