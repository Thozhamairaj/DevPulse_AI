from typing import List
from fastapi import APIRouter, HTTPException, Path
from backend.app.models.schemas import RecommendationItem, ApprovalUpdate
from backend.app.services.approval_service import approval_service

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

@router.get("", response_model=List[RecommendationItem])
def get_approvals():
    """Retrieve all mitigation recommendations eligible for review/approval."""
    return approval_service.get_all_recommendations()

@router.post("/{recommendation_id}", response_model=RecommendationItem)
def update_recommendation_status(
    payload: ApprovalUpdate,
    recommendation_id: str = Path(..., description="ID of recommendation to review"),
):
    """
    Approve or reject a recommendation.
    Updates only the approval status in local state; does not alter project records.
    """
    updated = approval_service.update_approval(recommendation_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Recommendation '{recommendation_id}' not found")
    return updated

