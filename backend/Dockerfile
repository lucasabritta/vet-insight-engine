FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (required for py-pglite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

COPY requirements-prod.txt /app/

RUN pip install --no-cache-dir -r /app/requirements-prod.txt

COPY . /app/

RUN mkdir -p /app/uploads

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
