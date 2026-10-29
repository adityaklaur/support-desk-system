import os
from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

local_db = Path(__file__).resolve().parent / "supportdesk.db"

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{local_db}"
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://", "postgresql://", 1
    )

is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
)

if is_sqlite:
    @event.listens_for(engine, "connect")
    def enable_foreign_keys(connection, record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_db_and_tables():
    import models
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
