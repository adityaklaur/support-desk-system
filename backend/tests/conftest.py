"""Pytest fixtures for isolated API tests (never use the real supportdesk.db)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from database import get_session
from main import app


@pytest.fixture
def client(tmp_path):
    """A fresh temporary SQLite database and test client for each test."""
    test_db = tmp_path / "supportdesk_test.sqlite"
    test_engine = create_engine(
        f"sqlite:///{test_db}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(test_engine, "connect")
    def enforce_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(test_engine)

    def override_get_session():
        with Session(test_engine) as session:
            yield session

    # TestClient without a context manager does not start the app lifespan,
    # which would initialize the non-test database on disk.
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_session] = override_get_session
    test_client = TestClient(app)
    try:
        yield test_client
    finally:
        test_client.close()
        app.dependency_overrides.clear()
        app.dependency_overrides.update(original_overrides)
        test_engine.dispose()
