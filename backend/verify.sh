#!/usr/bin/env bash
set -euo pipefail

# Move to repository root (script located in backend/)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Prefer an activated virtualenv or common venv dirs, fallback to system Python
PYTHON=""
if [[ -n "${VIRTUAL_ENV:-}" && -x "$VIRTUAL_ENV/bin/python" ]]; then
	PYTHON="$VIRTUAL_ENV/bin/python"
elif [[ -x "$REPO_ROOT/.venv/bin/python" ]]; then
	PYTHON="$REPO_ROOT/.venv/bin/python"
elif [[ -x "$REPO_ROOT/venv/bin/python" ]]; then
	PYTHON="$REPO_ROOT/venv/bin/python"
elif [[ -x "$REPO_ROOT/env/bin/python" ]]; then
	PYTHON="$REPO_ROOT/env/bin/python"
elif [[ -x "$REPO_ROOT/backend/venv/bin/python" ]]; then
	PYTHON="$REPO_ROOT/backend/venv/bin/python"
else
	PYTHON="$(command -v python3 || command -v python || true)"
fi

if [[ -z "$PYTHON" ]]; then
	echo "No Python interpreter found. Install Python or activate your virtualenv." >&2
	exit 2
fi

echo "Using Python: $PYTHON"

echo "Running Black (formats files)..."
if ! "$PYTHON" -m black .; then
	echo "Black failed or is not installed in $PYTHON." >&2
	echo "Install with: $PYTHON -m pip install black" >&2
	exit 3
fi

echo "Running Ruff (checks only; exits non-zero on issues)..."
if ! "$PYTHON" -m ruff check .; then
	echo "Ruff failed or found issues (or is not installed in $PYTHON)." >&2
	echo "Install with: $PYTHON -m pip install ruff" >&2
	exit 4
fi

echo "Done. Black formatted files; Ruff completed."
