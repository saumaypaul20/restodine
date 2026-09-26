"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import router as api_v1_router

# Create FastAPI app
app = FastAPI(
    title="RestoDine API",
    description="Multi-tenant in-restaurant digital ordering system",
    version="0.2.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_v1_router)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print(f"[RestoDine] FastAPI backend starting on {settings.HOST}:{settings.PORT}")
    print(f"[RestoDine] Environment: {settings.ENVIRONMENT}")
    print(f"[RestoDine] Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    print("[RestoDine] FastAPI backend shutting down")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "RestoDine API",
        "version": "0.2.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        reload=not settings.is_production(),
    )
