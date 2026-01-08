import logging
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    logging.getLogger("app.api.health").debug("health.check")
    return {"status": "healthy", "service": "vet-insight-engine"}
