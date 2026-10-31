from datetime import datetime
from typing import List, Dict, Optional, Any
from backend.app.models.schemas import RecommendationItem, ApprovalUpdate
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.project_service import project_service

class ApprovalService:
    """
    Manages review and approval workflows for AI-generated recommendations.
    Maintains approval statuses in memory.
    Never alters core project data or tasks.
    """

    def __init__(self):
        self._reviews: Dict[str, Dict[str, Any]] = {}
        self._initialized = False

    def _ensure_initialized(self):
        if not self._initialized:
            # Run initial orchestrator analysis to populate default recommendations
            projects = project_service.list_projects()
            if projects:
                orchestrator.run_analysis(projects[0].id)
            self._initialized = True

    def get_all_recommendations(self) -> List[RecommendationItem]:
        self._ensure_initialized()
        # Get latest recommendations from orchestrator
        projects = project_service.list_projects()
        if not projects:
            return []
        
        analysis = orchestrator.run_analysis(projects[0].id)
        # Apply any recorded reviews
        for rec in analysis.recommendations:
            if rec.id in self._reviews:
                review_data = self._reviews[rec.id]
                rec.approval_status = review_data["status"]
                rec.reviewed_at = review_data["reviewed_at"]
                rec.reviewer_comment = review_data.get("comment")

        return analysis.recommendations

    def update_approval(self, recommendation_id: str, update: ApprovalUpdate) -> Optional[RecommendationItem]:
        self._ensure_initialized()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._reviews[recommendation_id] = {
            "status": update.status,
            "reviewed_at": now_str,
            "comment": update.comment or f"Action {update.status.upper()} by Engineering Lead",
        }

        # Retrieve and return updated recommendation
        recs = self.get_all_recommendations()
        return next((r for r in recs if r.id == recommendation_id), None)

# Global approval service
approval_service = ApprovalService()
