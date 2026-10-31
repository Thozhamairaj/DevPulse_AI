from fastapi import APIRouter, HTTPException
from backend.app.models.schemas import SimulationRequest, SimulationResponse
from backend.app.services.simulator_service import simulator_service

router = APIRouter(prefix="/api/simulator", tags=["What-If Simulator"])

@router.post("/run", response_model=SimulationResponse)
def run_simulation(request: SimulationRequest):
    """
    Run hypothetical schedule impact simulation for a given task and additional delay.
    Guaranteed immutable: Does not alter project or task records.
    """
    try:
        response = simulator_service.run_simulation(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

