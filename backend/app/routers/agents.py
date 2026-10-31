from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from backend.app.models.schemas import ProjectAnalysisResponse, AgentActivityLog
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.project_service import project_service

router = APIRouter(prefix="/api/agents", tags=["Agents"])

class AnalyzeRequest(BaseModel):
    project_id: str

@router.post("/analyze", response_model=ProjectAnalysisResponse)
def run_agent_analysis(payload: AnalyzeRequest):
    """
    Triggers complete multi-agent pipeline:
    Risk Agent -> Dependency Agent -> Recommendation Agent -> Orchestration.
    """
    try:
        result = orchestrator.run_analysis(payload.project_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failure: {str(e)}")

@router.get("/activity", response_model=List[AgentActivityLog])
def get_agent_activities(limit: int = Query(50, ge=1, le=200)):
    """Retrieve chronologically ordered execution logs for all active agents."""
    return orchestrator.get_activity_history(limit=limit)

