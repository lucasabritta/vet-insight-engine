[![E2E LLM Extraction](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/e2e-llm-extraction.yml/badge.svg?branch=master)](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/e2e-llm-extraction.yml)
[![Lint](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/lint.yml/badge.svg?branch=master)](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/lint.yml)
[![Tests](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/test.yml)
[![Integration Test](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/integration.yml/badge.svg?branch=master)](https://github.com/lucasabritta/vet-insight-engine/actions/workflows/integration.yml)

# Vet Insight Engine

Automated extraction and structuring of veterinary medical records from diverse document formats (PDF, DOCX, images). FastAPI backend with LLM-powered data extraction, PostgreSQL persistence, and React frontend for editing and review.

## Architecture

**Stack:**

- Backend: Python + FastAPI + Pydantic v2
- Frontend: React + TypeScript + Vite
- Database: PostgreSQL
- OCR: Tesseract + EasyOCR (image fallback)
- LLM: OpenAI (gpt-4o-mini)

**Design Decisions:**

- Strategy Pattern for document extractors (PDF, DOCX, Image) to isolate file format logic.
- Dependency injection for database sessions and LLM clients.
- Structured output validation via Pydantic; LLM responses validated against VeterinaryRecordSchema.
- Metadata stored both in JSON files (for rapid access) and database (for persistence).
- Client-side state management via React hooks (useFormData, useSaveState) with URL-based filtering.

## Project Structure & Methodology

**Backend (`backend/`):**

```
app/
  ├── api/           # Route handlers (documents, health)
  ├── core/          # Config, settings
  ├── db/            # SQLAlchemy models, session management
  ├── schemas/       # Pydantic validation schemas
  ├── services/      # Business logic
  │   ├── document_service.py   # File upload, extraction, metadata
  │   ├── llm_service.py        # OpenAI integration with retry logic
  │   └── extraction/           # Strategy pattern extractors (PDF, DOCX, Image)
  └── main.py        # FastAPI app factory
tests/               # Unit and integration tests
alembic/             # DB migrations
```

**Methodology:** Layered architecture with clear separation—API routes delegate to services, services use extractors and LLM client. Pydantic validates all inputs/outputs. Logging at key entry points (upload, extraction, save).

**Frontend (`frontend/`):**

```
src/
  ├── components/    # Reusable React components (Form, Upload, Editor, Preview)
  ├── hooks/         # Custom hooks (useFormData, useSaveState)
  ├── lib/           # API client and utilities
  ├── utils/         # Helpers (nested object access)
  ├── App.tsx        # Main app orchestrator
  └── test files     # Co-located component/hook tests
```

**Methodology:** Component-driven with custom hooks for state management. Minimal client-side state—API responses drive UI. Tailwind CSS for styling. Vitest for unit/integration testing. Console logs at key user actions (upload, extract, save) for debugging.

## Setup & Execution

**Requirements:** Docker & Docker Compose

**Environment (`.env` at repo root):**

```
DB_USER=user
DB_PASSWORD=password
DB_NAME=vet_insight
OPENAI_API_KEY=sk-...
ENVIRONMENT=development
DEBUG=true
```

**Run all services:**

```powershell
docker compose up -d --build
```

**Access:**

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

**Stop:**

```powershell
docker compose down -v
```

## Testing

**Backend (pytest in container):**

```powershell
docker run --rm -v ${PWD}:/app -w /app -e DATABASE_URL=postgresql://user:password@postgres:5432/vet_insight vet-insight-backend:local pytest -q
```

**Frontend (vitest in container):**

```powershell
docker run --rm -v ${PWD}/frontend:/app -w /app node:20-slim sh -c "npm install && npm run test -- --run"
```

## Future Improvements

- **Async Processing:** Celery + Redis for batch document handling and callback webhooks.
- **Medical Ontologies:** Map diagnoses/medications to SNOMED CT or ICD-10 for standardization.
- **RAG Layer:** Enable historical record search and cross-case clinical insights via vector embeddings.
