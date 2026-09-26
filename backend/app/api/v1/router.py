from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["v1"])


@router.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@router.get("/health/db")
async def health_db():
    """Health check with database connectivity verification."""
    try:
        from app.db.session import engine
        async with engine.begin() as conn:
            await conn.execute(conn.raw_connection().test_typeorm())
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {
            "status": "error",
            "database": "disconnected",
            "error": str(e),
        }
