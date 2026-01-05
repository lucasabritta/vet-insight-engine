# Backend

FastAPI-based backend for the Vet Insight Engine.

## Setup

```bash
pip install -e ".[dev]"
```

## Running

### Development

```bash
python main.py
```

### With Docker

```bash
docker-compose up backend
```

## Testing

```bash
pytest
```

## Linting

```bash
ruff check .
ruff format .
```
