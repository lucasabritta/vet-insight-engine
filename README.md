# vet-insight-engine

An intelligent processing system for veterinary medical records. This platform automates the extraction and structuring of clinical data from diverse document formats (PDF, images, Word), providing veterinarians with a clean, editable interface for case review.

## 🏗 Architecture & Design Decisions

### Technical Stack
* **Backend:** Python (FastAPI)
* **Frontend:** React (TypeScript)
* **Database:** PostgreSQL

---

## 🚀 Getting Started

### Prerequisites
* Docker & Docker Compose

### Installation & Execution
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/vet-insight-engine.git](https://github.com/your-username/vet-insight-engine.git)
    cd vet-insight-engine
    ```
2.  **Run the application:**
    ```bash
    docker-compose up --build
    ```
---

## 🔍 Future Improvements
* **Asynchronous Scaling:** Integrate Celery/Redis for handling large document batches.
* **RAG Implementation:** Enable natural language querying across historical pet records.
* **Medical Normalization:** Map extracted terms to SNOMED CT or ICD-10 ontologies.
* **Compliance:** Implement PII masking for sensitive owner and pet information.
