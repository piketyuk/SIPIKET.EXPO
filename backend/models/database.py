import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.models import Base

DATABASE_URL = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./sipiket.db"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
    except Exception:
        engine = create_engine("sqlite:///./sipiket.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
