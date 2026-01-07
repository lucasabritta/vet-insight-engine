# Backend

FastAPI-based backend for the Vet Insight Engine.

## Setup

```bash
pip install -r requirements.txt
```

## Database

- Default connection: configured via `DATABASE_URL` (see `app/core/config.py`).
- Docker Compose provides a PostgreSQL service and sets `DATABASE_URL` for the backend container.
- Tables are created on app startup in development. For production, use migrations.

### Docker Compose (recommended)

From the `backend/` directory:

```bash
docker compose up --build
```

This starts PostgreSQL and the backend at http://localhost:8000.

Health check:

```bash
curl -sf http://localhost:8000/health
```

## Running locally

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Ensure `DATABASE_URL` points to a reachable PostgreSQL instance, e.g.:

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/vet_insight
```

## Testing

```bash
pytest -q
```

Some integration tests expect PostgreSQL to be available as defined by `DATABASE_URL`.

## Linting

```bash
ruff check backend --output-format full --statistics
ruff format backend
```
