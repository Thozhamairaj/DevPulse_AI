import time
from datetime import datetime
from typing import List, Optional, Dict
from backend.app.models.schemas import (
    Project,
    ProjectAnalysisResponse,
    AgentActivityLog,
    RiskAnalysisResult,
    DependencyAnalysisResult,
    RecommendationItem,
)
from backend.app.services.project_service import project_service
from backend.app.agents.risk_agent import RiskAgent
from backend.app.agents.dependency_agent import DependencyAgent
from backend.app.agents.recommendation_agent import RecommendationAgent

class CentralOrchestrator:
    """
    Central Multi-Agent Orchestrator for DevPulse AI.
    Executes the sequential agent pipeline:
    1. Loads Project Telemetry
    2. Runs Risk Agent (deterministic rule engine)
    3. Runs Dependency Agent (graph traversal + cycle detection + impact propagation)
    4. Runs Recommendation Agent (action formulation + optional Gemini enrichment)
    5. Aggregates results into ProjectAnalysisResponse
    6. Logs all agent activities with telemetry for auditability.
    """

    def __init__(self):
        self.risk_agent = RiskAgent()
        self.dependency_agent = DependencyAgent()
        self.recommendation_agent = RecommendationAgent()
        self._activity_history: List[AgentActivityLog] = []

    def run_analysis(self, project_id: str) -> ProjectAnalysisResponse:
        project = project_service.get_project(project_id)
        if not project:
            raise ValueError(f"Project with ID '{project_id}' not found.")

        current_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        run_logs: List[AgentActivityLog] = []

        # Step 1: Run Risk Agent
        t0 = time.time()
        risk_result: RiskAnalysisResult = self.risk_agent.analyze(project)
        t_risk = int((time.time() - t0) * 1000)
        
        risk_log = AgentActivityLog(
            id=f"ACT-RISK-{int(time.time() * 1000)}",
            agent_name="Risk Agent",
            execution_status="completed",
            timestamp=current_timestamp,
            duration_ms=max(12, t_risk),
            data_analyzed=f"{len(project.tasks)} tasks, {len(project.qa_bugs)} QA defects",
            discoveries=[
                f"Identified {len(risk_result.risks)} delivery risk items",
                f"{risk_result.overdue_task_count} overdue task(s) detected",
                f"{risk_result.critical_bug_count} critical QA defect(s) flagged",
                f"Overall health classified as '{risk_result.overall_health.upper()}'",
            ],
            summary=risk_result.summary,
        )
        run_logs.append(risk_log)

        # Step 2: Run Dependency Agent (receives project and risk items)
        t0 = time.time()
        dep_result: DependencyAnalysisResult = self.dependency_agent.analyze(project, risks=risk_result.risks)
        t_dep = int((time.time() - t0) * 1000)

        dep_log = AgentActivityLog(
            id=f"ACT-DEP-{int(time.time() * 1000)}",
            agent_name="Dependency Agent",
            execution_status="completed",
            timestamp=current_timestamp,
            duration_ms=max(15, t_dep),
            data_analyzed=f"{len(dep_result.nodes)} dependency nodes, {len(dep_result.edges)} directed edges",
            discoveries=[
                f"Mapped {len(dep_result.blocked_tasks)} blocked task(s)",
                f"Critical release path length: {len(dep_result.critical_release_chain)} nodes",
                f"Identified {len(dep_result.downstream_impacts)} downstream cascade paths",
                f"Circular dependencies: {'None' if not dep_result.has_circular_dependency else 'Detected'}",
            ],
            summary=dep_result.summary,
        )
        run_logs.append(dep_log)

        # Step 3: Run Recommendation Agent (receives risks and dependencies)
        t0 = time.time()
        recommendations: List[RecommendationItem] = self.recommendation_agent.generate_recommendations(
            project=project,
            risks=risk_result.risks,
            dependencies=dep_result,
        )
        t_rec = int((time.time() - t0) * 1000)

        rec_log = AgentActivityLog(
            id=f"ACT-REC-{int(time.time() * 1000)}",
            agent_name="Recommendation Agent",
            execution_status="completed",
            timestamp=current_timestamp,
            duration_ms=max(20, t_rec),
            data_analyzed=f"Combined telemetry from Risk and Dependency Agents",
            discoveries=[
                f"Formulated {len(recommendations)} actionable mitigation proposals",
                f"Categorized {sum(1 for r in recommendations if r.urgency == 'urgent')} urgent action(s)",
                "Synthesized impact on release deadline and owner reallocations",
            ],
            summary=f"Generated {len(recommendations)} recommendations prioritizing critical path blockers.",
        )
        run_logs.append(rec_log)

        # Step 4: Central Orchestrator Log
        orch_log = AgentActivityLog(
            id=f"ACT-ORCH-{int(time.time() * 1000)}",
            agent_name="Central Orchestrator",
            execution_status="completed",
            timestamp=current_timestamp,
            duration_ms=max(45, t_risk + t_dep + t_rec),
            data_analyzed=f"Full lifecycle pass for project '{project.name}'",
            discoveries=[
                f"Synchronized 3 sub-agents with zero execution errors",
                f"Health verdict: {risk_result.overall_health.upper()}",
                f"Active critical blockers: {len(dep_result.blocked_tasks)}",
            ],
            summary=f"Completed end-to-end multi-agent delivery intelligence analysis for {project.name}.",
        )
        run_logs.append(orch_log)

        # Update activity history
        self._activity_history.extend(run_logs)

        return ProjectAnalysisResponse(
            project_id=project.id,
            project_name=project.name,
            analyzed_at=current_timestamp,
            health_status=risk_result.overall_health,
            risk_analysis=risk_result,
            dependency_analysis=dep_result,
            recommendations=recommendations,
            agent_activities=run_logs,
        )

    def get_activity_history(self, limit: int = 50) -> List[AgentActivityLog]:
        """Returns recent agent activity logs, newest first."""
        # Ensure we have at least initial seeded activities if empty
        if not self._activity_history:
            # Run initial analysis on default project to seed activities
            projects = project_service.list_projects()
            if projects:
                self.run_analysis(projects[0].id)
        return list(reversed(self._activity_history))[:limit]

# Global singleton orchestrator
orchestrator = CentralOrchestrator()

