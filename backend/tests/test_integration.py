"""Stage 6 integration and contract tests; all writes use disposable SQLite."""
import time

from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlmodel import Session, SQLModel, create_engine

from database import get_session
from main import app
from models import Ticket
from services.ticket_service import is_overdue


def _payload(subject="Test ticket", **changes):
    data = {
        "subject": subject,
        "customer": "client@example.com",
        "description": "Example support request",
        "status": "Open",
        "priority": "Medium",
        "assignee": None,
    }
    data.update(changes)
    return data


def _database_engine(path):
    engine = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def enforce_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    SQLModel.metadata.create_all(engine)
    return engine


def test_api_contract_and_message_history(client):
    created = client.post("/api/tickets", json=_payload(assignee="Asha"))
    assert created.status_code == 201, created.text
    ticket = created.json()
    expected_ticket_fields = {
        "id", "subject", "customer", "description", "status", "priority",
        "assignee", "created_at", "updated_at", "overdue",
    }
    assert set(ticket) == expected_ticket_fields
    ticket_id = ticket["id"]

    updated = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "In Progress", "priority": "Urgent", "assignee": "Rahul"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["status"] == "In Progress"

    for is_internal in (False, True):
        posted = client.post(
            f"/api/tickets/{ticket_id}/messages",
            json={"author": "Asha", "content": "Checking request", "is_internal": is_internal},
        )
        assert posted.status_code == 201, posted.text
        assert posted.json()["is_internal"] == is_internal

    detail = client.get(f"/api/tickets/{ticket_id}")
    assert detail.status_code == 200
    assert len(detail.json()["messages"]) == 2
    history_types = {event["event_type"] for event in detail.json()["history"]}
    assert {"ticket_created", "status_changed", "priority_changed", "assignee_changed", "public_reply_added", "internal_note_added"} <= history_types

    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    assert set(dashboard.json()) == {
        "total", "open", "in_progress", "waiting_on_customer", "resolved", "urgent", "overdue",
    }
    assert dashboard.json()["total"] == 1


def test_cors_preflight_and_openapi(client):
    response = client.options(
        "/api/tickets",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == 200, response.text
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

    paths = client.get("/openapi.json").json()["paths"]
    assert {"/api/health", "/api/dashboard", "/api/tickets", "/api/tickets/{ticket_id}", "/api/tickets/{ticket_id}/messages"} <= set(paths)
    assert {"get", "post"} <= set(paths["/api/tickets"])
    assert {"get", "patch"} <= set(paths["/api/tickets/{ticket_id}"])


def test_search_does_not_treat_wildcards_as_sql_patterns(client):
    assert client.post("/api/tickets", json=_payload("100% availability")).status_code == 201
    assert client.post("/api/tickets", json=_payload("100X availability")).status_code == 201
    assert [t["subject"] for t in client.get("/api/tickets", params={"search": "100%"}).json()] == ["100% availability"]
    assert client.post("/api/tickets", json=_payload("under_score")).status_code == 201
    assert client.post("/api/tickets", json=_payload("underXscore")).status_code == 201
    assert [t["subject"] for t in client.get("/api/tickets", params={"search": "under_"}).json()] == ["under_score"]


def test_overdue_exact_boundary():
    now = int(time.time())
    ticket = Ticket(subject="Boundary", customer="c", description="d", status="Open", created_at=now - 86400)
    assert is_overdue(ticket, now=now) is False
    assert is_overdue(ticket, now=now + 1) is True
    ticket.status = "Resolved"
    assert is_overdue(ticket, now=now + 86400) is False


def test_persistence_across_new_database_connection(tmp_path):
    """Simulates an application restart with the same persistent SQLite file."""
    db_path = tmp_path / "persistent.sqlite"
    first_engine = _database_engine(db_path)

    def first_session():
        with Session(first_engine) as session:
            yield session

    try:
        app.dependency_overrides[get_session] = first_session
        client = TestClient(app)  # Avoid lifespan: never initialize production DB.
        created = client.post("/api/tickets", json=_payload("Persists after restart"))
        assert created.status_code == 201, created.text
        ticket_id = created.json()["id"]
        reply = client.post(
            f"/api/tickets/{ticket_id}/messages",
            json={"author": "Agent", "content": "Saved reply", "is_internal": False},
        )
        assert reply.status_code == 201
        client.close()
    finally:
        app.dependency_overrides.clear()
        first_engine.dispose()

    second_engine = _database_engine(db_path)

    def second_session():
        with Session(second_engine) as session:
            yield session

    try:
        app.dependency_overrides[get_session] = second_session
        second_client = TestClient(app)
        detail = second_client.get(f"/api/tickets/{ticket_id}")
        assert detail.status_code == 200
        assert detail.json()["subject"] == "Persists after restart"
        assert [m["content"] for m in detail.json()["messages"]] == ["Saved reply"]
        assert len(detail.json()["history"]) >= 2
        second_client.close()
    finally:
        app.dependency_overrides.clear()
        second_engine.dispose()
