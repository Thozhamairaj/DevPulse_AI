import os
import sys
from pathlib import Path
from datetime import datetime

# Ensure project root is in sys.path regardless of current working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from backend.app.routers import projects, agents, assistant, simulator, approvals
from backend.app.services.gemini_service import gemini_service

app = FastAPI(
    title="DevPulse AI - Agentic Engineering Delivery Intelligence Platform",
    description="Multi-agent AI platform analyzing project delivery risks, dependencies, what-if simulations, and recommendations.",
    version="1.0.0",
)

# Enable CORS for frontend Vite development server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Safe error message without leaking internal stack traces or keys
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal service error occurred. Please check server logs.", "error_type": exc.__class__.__name__},
    )

@app.get("/api/health")
def health_check():
    """Health check endpoint reporting API status and Gemini service readiness."""
    return {
        "status": "healthy",
        "service": "DevPulse AI Platform",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "gemini_service": {
            "configured": gemini_service.is_available,
            "model": gemini_service.model,
            "mode": "live_gemini" if gemini_service.is_available else "deterministic_fallback",
        },
    }

# Register API Routers
app.include_router(projects.router)
app.include_router(agents.router)
app.include_router(assistant.router)
app.include_router(simulator.router)
app.include_router(approvals.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("BACKEND_PORT", 8000))
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)

