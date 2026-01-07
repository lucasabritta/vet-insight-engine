# vet-insight-engine

An intelligent processing system for veterinary medical records. This platform automates the extraction and structuring of clinical data from diverse document formats (PDF, images, Word), providing veterinarians with a clean, editable interface for case review.

## 🏗 Architecture & Design Decisions

### Technical Stack

- **Backend:** Python (FastAPI)
- **Frontend:** React (TypeScript)
- **Database:** PostgreSQL

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose

### Installation & Execution

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/vet-insight-engine.git](https://github.com/your-username/vet-insight-engine.git)
    cd vet-insight-engine
    ```
2.  **Run full stack with Docker Compose (Frontend + Backend + Postgres):** - Ensure a `.env` exists at the repo root with `OPENAI_API_KEY` and DB vars. Example:
    `env
        DB_USER=user
        DB_PASSWORD=password
        DB_NAME=vet_insight
        ENVIRONMENT=development
        DEBUG=true
        OPENAI_API_KEY=sk-...
        UPLOAD_DIR=/app/uploads
        MAX_UPLOAD_SIZE_MB=50
        ` - Start services (PowerShell on Windows):
    `powershell
        Push-Location backend; docker compose --env-file ../.env down -v; Pop-Location
        docker compose --env-file .env up -d --build
        ` - Verify health:
    `powershell
        Invoke-RestMethod -Uri http://localhost:8000/health -TimeoutSec 10
        ` - Frontend is available at: http://localhost:5173 - The frontend container uses `VITE_API_URL=http://backend:8000` over the Docker network. - Stop services:
    `powershell
        docker compose --env-file .env down -v
        `

---

## 🔍 Future Improvements

- **Asynchronous Scaling:** Integrate Celery/Redis for handling large document batches.
- **RAG Implementation:** Enable natural language querying across historical pet records.
- **Medical Normalization:** Map extracted terms to SNOMED CT or ICD-10 ontologies.
- **Compliance:** Implement PII masking for sensitive owner and pet information.
