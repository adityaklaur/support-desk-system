#!/usr/bin/env bash
# Mac-friendly one-command verification of backend tests and frontend build.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

printf '\n=== SupportDesk Stage 6 Verification ===\n'
if [[ -x backend/.venv/bin/python ]]; then
  PYTHON="$ROOT/backend/.venv/bin/python"
else
  PYTHON="$(command -v python3 || true)"
fi
if [[ -z "$PYTHON" ]]; then
  echo "ERROR: python3 missing. Install Python 3.10+." >&2; exit 1
fi
if ! command -v npm >/dev/null; then
  echo "ERROR: npm missing. Install a compatible Node.js version." >&2; exit 1
fi
if [[ ! -d frontend/node_modules ]]; then
  echo "ERROR: Frontend dependencies missing. Run cd frontend && npm install." >&2; exit 1
fi

printf '\nPython: '; "$PYTHON" --version
printf 'Node: '; node --version
printf 'npm: '; npm --version

printf '\n--- Backend tests ---\n'
(cd backend && "$PYTHON" -m pytest -v)
printf '\n--- Frontend production build ---\n'
(cd frontend && npm run build)
printf '\nPASS: Backend tests and frontend build completed.\n'
printf 'NEXT: Run scripts/check_live_api.py against your local backend and complete the manual UI checklist.\n'
