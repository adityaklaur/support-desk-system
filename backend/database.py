from pathlib import Path

from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

# Absolute path makes the database location independent of the terminal folder.
DATABASE_PATH = Path(__file__).resolve().parent / "supportdesk.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    # SQLite does not enforce foreign keys unless this is enabled per connection.
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def create_db_and_tables() -> None:
    # Import the models before create_all, so SQLModel knows every table.
    import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session():
    # FastAPI dependency; each request gets a separate database session.
    with Session(engine) as session:
        yield session
