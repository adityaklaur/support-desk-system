# SupportDesk — Full-Stack Support Ticket System

**Comhard practical engineering assessment** · React + TypeScript + Vite · FastAPI + SQLModel · SQLite

SupportDesk is a local-first support-ticket management prototype. Agents can create and update tickets, assign them to a named person, reply or add internal-labeled notes, search and filter queues, review an activity timeline, and monitor live counts for open, in-progress, resolved, urgent and overdue tickets.

> **Submission status:** Source code for all required prototype workflows is included. Run `./scripts/verify_submission.sh` and the manual browser checklist on the submission Mac before claiming that the application is fully verified. Internal notes are *labels*, not access-controlled private messages.

## 1. Technology and architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| UI | React 19, TypeScript, Vite, CSS | Screens, interaction state, validation feedback, Fetch requests |
| API | Python 3.10+, FastAPI, Pydantic | HTTP routes, schema validation, CORS, structured JSON responses |
| Services | Python | Ticket business rules, activity logging, overdue calculation |
| ORM | SQLModel / SQLAlchemy | Maps model objects and queries to relational tables |
| Storage | SQLite | Stores tickets, messages and history in `backend/supportdesk.db` |

```text
Browser :5173
  React pages/components
    ↓ Fetch API, JSON
FastAPI :8000
  /api/tickets, /api/dashboard
    ↓ Pydantic validation
  Services: ticket_service, history_service
    ↓ SQLModel + SQLite transactions
  supportdesk.db
    ├─ tickets (1)
    ├─ messages (many per ticket)
    └─ activities (many per ticket)
```

**Design choice:** A three-tier monolithic prototype fits the time-limited assessment better than microservices. The frontend does not access SQLite directly. Ticket changes and history records are committed together, preventing inconsistent audit trails on normal transaction failures.

## 2. Repository structure

```text
support-desk-system/
├── backend/
│   ├── main.py                    # FastAPI application, CORS, startup
│   ├── database.py                # SQLite engine and session dependency
│   ├── requirements.txt
│   ├── models/                    # Ticket, Message, Activity ORM entities
│   ├── schemas/                   # Input and response validation
│   ├── services/                  # Business rules and audit logging
│   ├── routers/                   # Tickets, Messages, Dashboard routes
│   └── tests/                     # Isolated pytest suite
├── frontend/
│   ├── src/
│   │   ├── pages/                 # Dashboard, Tickets, NewTicket, TicketDetails
│   │   ├── components/            # TicketForm, status badges, icons, spinner
│   │   ├── services/api.ts        # Central Fetch API client
│   │   ├── types.ts               # Shared frontend API types
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
├── scripts/
│   ├── verify_submission.sh      # Run pytest + frontend build
│   └── check_live_api.py         # Read-only live API check
├── TEST_PLAN.md                  # Functional test and interview/demo script
├── SUBMISSION_REPORT.md          # Evidence/limitations status
├── .gitignore
└── README.md
```

## 3. Prerequisites

- **macOS** (instructions below); Linux/Windows can run with equivalent shell paths.
- **Python** 3.10+ and `pip`.
- **Node.js** 20.19+ or 22.12+ (compatible with the selected Vite version), with npm.
- Cursor (or any code editor), a web browser and Git.
- SQLite is bundled with standard Python; no separate database server needed.

Check versions in Cursor → Terminal → New Terminal:

```bash
python3 --version
node --version
npm --version
git --version
```

## 4. Installation and database setup (macOS)

Open this project folder in Cursor. From the root, run:

**Terminal 1 — Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Open <http://localhost:8000/docs> for interactive Swagger API documentation or <http://localhost:8000/api/health> for `{"status":"ok"}`.

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local    # Optional: defaults already target http://localhost:8000/api
npm run dev
```

Open <http://localhost:5173>.

**Database initialization:** On FastAPI startup, `create_db_and_tables()` calls `SQLModel.metadata.create_all(engine)`. This creates `backend/supportdesk.db` and the `tickets`, `messages` and `activities` tables when they do not already exist. The three tables have primary keys; messages/activities reference `tickets.id` through foreign keys. The SQLite connection enables `PRAGMA foreign_keys=ON`. **Do not delete `supportdesk.db`** if you want to preserve saved tickets. `create_all` does not perform migrations for future table changes.

For a read-only table check using built-in Python:

```bash
cd backend
python - <<'PY'
import sqlite3
conn = sqlite3.connect('supportdesk.db')
print(conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
conn.close()
PY
```

Expected table names: `activities`, `messages`, `tickets`.

## 5. REST API contract

| Method | Route | Expected outcome |
| --- | --- | --- |
| GET | `/api/health` | `{"status":"ok"}` |
| GET | `/api/tickets` | Array of ticket objects, with search/filters/sort |
| POST | `/api/tickets` | New ticket, HTTP 201 |
| GET | `/api/tickets/{ticket_id}` | Ticket with `messages[]` and `history[]` |
| PATCH | `/api/tickets/{ticket_id}` | Updated ticket and history events |
| POST | `/api/tickets/{ticket_id}/messages` | Reply or note, HTTP 201 |
| GET | `/api/dashboard` | Live statistics from SQLite |

Search and sorting query names, matching the React client exactly:

```text
GET /api/tickets?search=login&status=In%20Progress&priority=Urgent&assignee=Asha&sort_by=priority
```

- `search`: case-insensitive substring search on `subject` or `customer`, with literal `%` and `_` handling.
- `status`: `Open`, `In Progress`, `Waiting on Customer`, `Resolved`.
- `priority`: `Low`, `Medium`, `High`, `Urgent`.
- `assignee`: case-insensitive exact match.
- `sort_by`: `updated` (descending) or `priority` (Urgent → High → Medium → Low, then updated).
- Filters can be applied **together**.

Create-ticket request:

```json
{
  "subject": "Login failure",
  "customer": "customer@example.com",
  "description": "Customer cannot sign in",
  "status": "Open",
  "priority": "High",
  "assignee": "Asha"
}
```

Update-ticket request (partial body accepted):

```json
{"status": "In Progress", "priority": "Urgent", "assignee": "Rahul"}
```

Message request:

```json
{"author": "Rahul", "content": "Investigating the error.", "is_internal": false}
```

An internal-labeled note uses `"is_internal": true`.

**Response fields:** `Ticket` responses use `id`, `subject`, `customer`, `description`, `status`, `priority`, `assignee`, `created_at`, `updated_at`, `overdue`. Details additionally contain `messages` and `history`. Timestamps are **UTC Unix seconds**, converted to local date/time by the browser. Dashboard response keys are `total`, `open`, `in_progress`, `waiting_on_customer`, `resolved`, `urgent`, `overdue`.

**HTTP errors:** invalid requests return 422, missing tickets 404. Successful reads/updates return 200; creations return 201.

## 6. Business rules

**Overdue:** a ticket is overdue when it is not Resolved **and** its age since `created_at` exceeds 24 hours (`> 86400` seconds). The property is calculated on reads; there is no scheduler. A resolved ticket is never overdue.

**Activity history:** created, assignment changed, status changed, priority changed, other ticket fields edited, public reply added and internal note added. Activity records are separate from message content. A ticket update and its activity entries are committed in one SQLite transaction.

**Sorting:** priority order uses a SQL `CASE` expression; updates are sorted by descending `updated_at` with descending ticket ID as tie-breaker.

## 7. Implemented features and scope

| Requirement | Source implementation | Where |
| --- | --- | --- |
| Create/view/edit/assign tickets | Included | Ticket routes, services, React forms/details |
| All four statuses and four priorities | Included | Pydantic types, frontend selectors |
| Public replies and internal notes | Included | Message route, ticket-details conversation UI |
| Search by subject/customer | Included | Ticket service + Tickets page |
| Combined status/priority/assignee filtering | Included | Query filters + UI controls |
| Sorting by update/priority | Included | SQL ordering + UI selector |
| Activity history | Included | Activity table/service + timeline UI |
| Dashboard counts | Included | Dashboard route + React cards |
| Overdue detection | Included | Dynamic 24-hour business rule |
| Persistence | Included | SQLite disk-backed database |
| Required-field validation / errors | Included | Pydantic + React forms + HTTP error UI |
| Automated tests | Included | `backend/tests/` |

**Not implemented / intentionally out of scope:** login, authentication, authorization, protected internal notes, email notifications, file attachments, ticket deletion, user/agent account management, pagination, server-pushed updates, cloud hosting and production-grade migrations. These are not claimed as completed features.

## 8. Testing and final verification

From the project root on your Mac (after installing dependencies):

```bash
./scripts/verify_submission.sh
```

The script executes `python -m pytest -v` using the project's virtual environment and then `npm run build`. A nonzero exit means verification failed; fix errors before submission.

With the backend running, execute this **read-only** live API contract check from the root:

```bash
python3 scripts/check_live_api.py
```

The check does not create, edit or delete tickets.

For full-stack browser testing, open `TEST_PLAN.md` and complete the manual checklist. Automated backend tests use disposable in-memory or temporary-file SQLite, **not your existing `supportdesk.db`**. The persistent-database test simulates reopening the same SQLite file with a new engine.

For a reproducible handover, commit `frontend/package-lock.json` generated by `npm install`. After validating backend dependencies on your Mac, pin compatible versions of the direct dependencies in `backend/requirements.txt` (and optionally store a complete `pip freeze` output as a lock snapshot). Do **not** submit `.venv`, `node_modules`, the SQLite database containing your personal/test data, or `.env.local`.

## 9. Known issues and limitations

1. **No identity or permission enforcement.** A user can access any local ticket through the API. `is_internal` is a display label and **does not restrict access**. Do not use with sensitive customer information.
2. **Manual refreshing.** Dashboard and ticket lists fetch on screen entry/refresh and don't poll; counts can become stale while the view stays open.
3. **SQLite/local prototype.** No production concurrency strategy, migrations or cloud deployment.
4. **Timestamp resolution.** `updated_at` uses integer Unix seconds; the backend advances the timestamp on rapid successive updates to preserve sort order. This can briefly make `updated_at` appear later than wall-clock time.
5. **No pagination.** Ticket listing and dashboard scan current records and are suitable for a small assessment dataset only.
6. **Unverified local integration until tested.** See `SUBMISSION_REPORT.md` for the exact verification evidence; this archive is assembled from the prior Stage 4/5 project packages, not from the user's separate Mac filesystem.

## 10. AI tools used

ChatGPT was used to help plan the three-tier architecture, generate initial backend and frontend scaffolding, create SQLModel models, FastAPI routes, tests, documentation and integration review. Claude was also used (or is available through Cursor) as a development assistant for React/TypeScript UI work, code review and debugging as applicable; **confirm and edit this sentence to match your actual AI usage before submission**. Cursor was used as the IDE for writing and running project code on macOS. All AI-generated code requires developer review and test verification; the developer is responsible for the final implementation, functionality and explanation.

For the interview, explain the code's actual responsibilities: React manages presentation; FastAPI validates requests and enforces business rules; SQLModel persists state to SQLite; messages and history reference tickets using foreign keys; operations and audit records are committed together.

## 11. Example interview demonstration

1. Start FastAPI and Vite; show the dashboard.
2. Create a High-priority ticket assigned to Rahul.
3. In ticket details, change status to In Progress and priority to Urgent.
4. Add one public reply and one internal note; show the activity history.
5. In the ticket list, combine subject search with status, priority and assignee filters.
6. Show that dashboard totals reflect the updated data, then restart the backend and verify the saved ticket remains.
7. Show `pytest` and the production TypeScript build; describe the known limitations.

---

**Assessment-ready acceptance condition:** Both servers run on macOS, `./scripts/verify_submission.sh` passes, the read-only live smoke check passes, and the UI flows in `TEST_PLAN.md` pass. Source-code presence alone does not establish that every requirement was tested successfully.
