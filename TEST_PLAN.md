# SupportDesk — Stage 6 Functional Test Plan

**Test environment:** macOS / Cursor / Chrome or Edge · Frontend `http://localhost:5173` · Backend `http://localhost:8000`

## Automated verification

- [ ] `cd backend && source .venv/bin/activate && python -m pytest -v` completes with no failures.
- [ ] `cd frontend && npm run build` completes and creates `frontend/dist/`.
- [ ] `python3 scripts/check_live_api.py` prints `SUCCESS` while FastAPI is running.
- [ ] Open `http://localhost:8000/docs` and confirm seven operations are listed across five routes.

## Browser end-to-end tests

| ID | Test steps | Expected result | Pass? |
| --- | --- | --- | --- |
| 01 | Open React home page (fresh database, if applicable) | Dashboard renders valid zero counts | [ ] |
| 02 | Create ticket: subject Login issue; customer demo@example.com; description Can't sign in; priority High; assignee Rahul | Success, ticket ID assigned and navigates to detail | [ ] |
| 03 | Refresh details page or return via queue | Ticket is present in list and detail view | [ ] |
| 04 | Edit ticket to In Progress, Urgent, Asha | UI and GET API show changed values | [ ] |
| 05 | Add a public reply by Asha | Appears in conversation, `is_internal=false` | [ ] |
| 06 | Add an internal note by Asha | Note visually distinguished, `is_internal=true` | [ ] |
| 07 | View history | Creation, assignment, status, priority, public reply and internal note events listed | [ ] |
| 08 | Search `login` | Matches ticket subject; search is case-insensitive | [ ] |
| 09 | Search `demo@example.com` | Matches customer | [ ] |
| 10 | Combine status In Progress + priority Urgent + assignee Asha + search login | Only matching ticket remains | [ ] |
| 11 | Clear filters | Full ticket list returns | [ ] |
| 12 | Create Low, High, Urgent tickets then sort by priority | Urgent ahead of High ahead of Low | [ ] |
| 13 | Edit older ticket and sort by updated | Recently updated ticket appears first | [ ] |
| 14 | Dashboard refresh | Counters match saved tickets | [ ] |
| 15 | Submit blank subject in create form | Form refuses to submit | [ ] |
| 16 | Send blank public message | Form refuses to submit | [ ] |
| 17 | Backend Swagger POST with invalid priority `Critical` | HTTP 422 | [ ] |
| 18 | Backend Swagger GET `/api/tickets/999999` | HTTP 404 | [ ] |
| 19 | With backend stopped, refresh frontend dashboard | Understandable error and retry button | [ ] |
| 20 | Restart backend, refresh React, reopen ticket | Previously saved ticket, messages and history remain | [ ] |
| 21 | Open responsive view using browser dev tools mobile width | Ticket cards and navigation remain usable | [ ] |
| 22 | Edit to Resolved | Resolved count rises, ticket is not overdue | [ ] |
| 23 | In isolated pytest suite, create unresolved ticket older than 24h | Overdue true after >24 hours | [ ] |

## Environment and safety checks

- [ ] `backend/supportdesk.db` exists locally; not included in submission archive.
- [ ] `frontend/package-lock.json` exists and is committed for reproducibility.
- [ ] `.venv`, `node_modules`, `dist`, `.env.local`, user/test data and secrets are excluded from final ZIP/Git.
- [ ] README contains truthful descriptions of completed and incomplete features.
- [ ] AI usage statement accurately reflects actual ChatGPT and Claude work.

## Results log — fill in on the Mac

| Date/time | Test or command | Result | Notes |
| --- | --- | --- | --- |
| | `python -m pytest -v` | NOT YET RUN | |
| | `npm run build` | NOT YET RUN | |
| | `scripts/check_live_api.py` | NOT YET RUN | |
| | Browser checklist | NOT YET RUN | |

**Do not claim complete end-to-end verification until the checks above have actually passed.**
