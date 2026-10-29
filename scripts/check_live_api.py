#!/usr/bin/env python3
"""Non-destructive live backend API contract smoke test. Uses stdlib only."""
import json
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = "http://localhost:8000"


def fetch(path):
    req = Request(BASE + path, headers={"Accept": "application/json"})
    with urlopen(req, timeout=8) as response:
        assert response.status == 200, f"{path}: HTTP {response.status}"
        return json.load(response)


def main():
    assert fetch("/api/health") == {"status": "ok"}
    print("PASS  /api/health")
    tickets = fetch("/api/tickets?sort_by=updated")
    assert isinstance(tickets, list)
    print(f"PASS  /api/tickets ({len(tickets)} records)")
    if tickets:
        detail = fetch(f"/api/tickets/{tickets[0]['id']}")
        assert isinstance(detail.get("messages"), list)
        assert isinstance(detail.get("history"), list)
        assert isinstance(detail.get("overdue"), bool)
        print("PASS  /api/tickets/{id} detail contract")
    dashboard = fetch("/api/dashboard")
    expected = {"total", "open", "in_progress", "waiting_on_customer", "resolved", "urgent", "overdue"}
    assert expected <= set(dashboard), f"Missing dashboard keys: {expected - set(dashboard)}"
    assert dashboard["total"] == len(tickets)
    print("PASS  /api/dashboard counts contract")
    paths = fetch("/openapi.json")["paths"]
    assert {"/api/health", "/api/tickets", "/api/tickets/{ticket_id}", "/api/tickets/{ticket_id}/messages", "/api/dashboard"} <= set(paths)
    print("PASS  /openapi.json endpoint contract")
    print("SUCCESS: Read-only live API checks passed. No records changed.")


if __name__ == "__main__":
    try:
        main()
    except (HTTPError, URLError, ValueError, AssertionError, TimeoutError, KeyError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        print("Tip: Run the backend with: cd backend && source .venv/bin/activate && uvicorn main:app --reload", file=sys.stderr)
        sys.exit(1)
