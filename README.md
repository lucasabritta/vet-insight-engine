# vet-insight-engine

An intelligent processing system for veterinary medical records. This platform automates the extraction and structuring of clinical data from diverse document formats (PDF, images, Word), providing veterinarians with a clean, editable interface for case review.

## 🏗 Architecture & Design Decisions

### Technical Stack
* **Backend:** Python (FastAPI)
* **Frontend:** React (TypeScript)
* **Database:** PostgreSQL
* **LLM Integration:** OpenAI (GPT-4o-mini)
* **OCR:** Tesseract

### Key Components

#### 1. Document Extraction Layer
Extracts text from multiple formats:
- **PDF:** PyMuPDF (fitz)
- **Images (PNG, JPEG):** Tesseract OCR
- **DOCX:** python-docx

#### 2. LLM-Powered Structured Extraction
Uses OpenAI to convert raw text into structured veterinary records:
- **Schema:** `VeterinaryRecordSchema` (Pydantic v2)
- **Retry Logic:** Exponential backoff with configurable max retries
- **Error Handling:** Graceful failures with detailed error messages
- **Validation:** Strict schema validation to ensure data quality

#### 3. Veterinary Record Schema
Structured data model for veterinary medical records:
```
VeterinaryRecordSchema
├── pet (PetSchema): Name, species, breed, age, weight, microchip
├── clinic_name: Practice name
├── veterinarian: Vet name
├── visit_date: Date of visit
├── chief_complaint: Reason for visit
├── clinical_history: Patient history summary
├── physical_examination: Exam findings
├── diagnoses (list[DiagnosisSchema]): Conditions, severity, notes
├── medications (list[MedicationSchema]): Name, dosage, route, indication
├── treatment_plan: Recommended treatment
├── prognosis: Expected outcome
└── follow_up: Follow-up recommendations
```

---

## 🚀 Getting Started

### Prerequisites
* Docker & Docker Compose
* OpenAI API Key (for LLM integration)

### Environment Setup

#### 1. Set OpenAI API Key
Create a `.env` file in the repository root with:
```dotenv
OPENAI_API_KEY=sk-your-key-here
DB_USER=user
DB_PASSWORD=password
DB_NAME=vet_insight
ENVIRONMENT=development
DEBUG=true
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE_MB=50
```

**Security Note:** Never commit `.env` to version control. Use GitHub Secrets in CI/CD:
```yaml
# In .github/workflows/test.yml or deploy.yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Installation & Execution

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/vet-insight-engine.git
    cd vet-insight-engine
    ```

2.  **Configure environment:**
    ```bash
    # Copy example and edit with your credentials
    cp .env.example .env
    # Edit .env with your OpenAI API key
    ```

3.  **Run the application:**
    ```bash
    docker-compose up --build
    ```

4.  **Run tests:**
    ```bash
    # Backend tests with coverage
    docker run --rm -v $(pwd):/app -w /app vet-insight-backend:local \
      pytest backend/tests/unit --cov=backend/app --cov-report=term-missing
    
    # Lint check
    docker run --rm -v $(pwd):/app -w /app vet-insight-backend:local \
      python -m ruff check backend
    ```
---

## � API Usage

### Extract and Structure Document
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

File: <veterinary_document.pdf|png|docx>

Response:
{
  "id": "doc-uuid",
  "status": "extracted",
  "record": {
    "pet": {...},
    "clinic_name": "...",
    "diagnoses": [...],
    "medications": [...],
    ...
  }
}
```

## 🧪 Testing

### Test Coverage
- **Unit Tests:** 10+ tests for extraction, OCR, and LLM logic
- **Integration Tests:** Document upload and end-to-end extraction flows
- **Schema Validation:** Pydantic validation of veterinary record structures

### Run Tests Locally
```bash
# All unit tests
pytest backend/tests/unit -v

# With coverage report
pytest backend/tests/unit --cov=backend/app --cov-report=html

# Specific test file
pytest backend/tests/unit/test_llm_service.py -v
```

## 🔍 Future Improvements
* **Asynchronous Scaling:** Integrate Celery/Redis for handling large document batches.
* **RAG Implementation:** Enable natural language querying across historical pet records.
* **Medical Normalization:** Map extracted terms to SNOMED CT or ICD-10 ontologies.
* **Compliance:** Implement PII masking for sensitive owner and pet information.
* **Multi-Language Support:** Handle veterinary records in multiple languages.
* **Custom Model Fine-Tuning:** Fine-tune LLM on domain-specific veterinary data.
