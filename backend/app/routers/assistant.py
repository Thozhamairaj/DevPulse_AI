from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import ChatRequest, ChatResponse
from backend.app.services.project_service import project_service
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest):
    """
    Conversational AI interface powered by Gemini with full project context.
    Falls back gracefully to rich deterministic intelligence if API is unavailable.
    """
    project = project_service.get_project(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{request.project_id}' not found")

    # Fetch live agent analysis for real-time grounded context
    try:
        analysis = orchestrator.run_analysis(request.project_id)
        risks = analysis.risk_analysis.risks
        dependencies = analysis.dependency_analysis
    except Exception:
        risks = []
        dependencies = None

    history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]

    response = gemini_service.answer_chat_query(
        message=request.message,
        project=project,
        risks=risks,
        dependencies=dependencies,
        history=history_dicts,
    )

    return response

