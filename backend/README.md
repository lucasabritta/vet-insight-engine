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

### Running Tests

All tests use py-pglite for automatic database isolation. No manual database setup required.

**Run all tests:**

```bash
pytest
```

**Run with coverage:**

```bash
pytest --cov=app --cov-report=term-missing --cov-report=html
```

**Run unit tests only:**

```bash
pytest tests/unit
```

**Run integration tests only:**

```bash
pytest tests/integration
```

**Run in Docker:**

```bash
docker run --rm -v ${PWD}:/app -w /app -e DATABASE_URL=sqlite:///./test.db vet-insight-backend:local pytest --cov=app --cov-report=term-missing
```

### Coverage Standards

**Minimum Coverage Requirements:**

- Overall: **80%** (enforced in CI)
- Critical modules (document_service, llm_service): **80%+**

**View coverage reports:**

```bash
# Generate HTML report
pytest --cov=app --cov-report=html

# Open in browser
open htmlcov/index.html  # macOS
start htmlcov\index.html  # Windows
```

**Current Coverage (as of last update):**

- Total: 85%
- app/api/documents.py: 97%
- app/services/llm_service.py: 82%
- app/services/document_service.py: 74%

### Test Structure

```
tests/
├── conftest.py             # Shared fixtures (mock data, test client)
├── unit/                   # Unit tests (isolated, fast)
│   ├── test_extraction_*.py
│   ├── test_health.py
│   ├── test_llm_service.py
│   └── test_documents.py
└── integration/            # Integration tests (database, full pipeline)
	├── test_documents.py
	├── test_documents_pipeline.py
	├── test_documents_samples.py
	└── test_persistence.py
```

### Writing Tests

**Mock external LLM calls to avoid API costs:**

```python
from unittest.mock import patch

with patch("app.services.llm_service.extract_structured_record") as mock_llm:
	mock_llm.return_value = VeterinaryRecordSchema(...)
	# Your test code
```

**Use fixtures for test data:**

```python
def test_upload(client, mock_pdf_file):
	response = client.post(
		"/documents/upload",
		files={"file": ("test.pdf", mock_pdf_file, "application/pdf")}
	)
	assert response.status_code == 200
```

**Test both success and failure paths:**

```python
def test_upload_success(client, mock_pdf_file):
	# Test happy path
	pass

def test_upload_file_too_large(client, mock_large_file):
	# Test error handling
	pass
```

### CI/CD Integration

Tests run automatically on every commit via GitHub Actions:

- Unit tests with coverage reporting
- Integration tests with coverage appending
- Build fails if coverage < 80%
- Coverage reports uploaded as artifacts (30-day retention)

See [.github/workflows/test.yml](../../.github/workflows/test.yml) for configuration.

## Linting

```bash
ruff check backend --output-format full --statistics
ruff format backend
```
