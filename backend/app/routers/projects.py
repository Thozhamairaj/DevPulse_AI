from typing import List, Dict
from fastapi import APIRouter, HTTPException, Path
from backend.app.models.schemas import (
    Project,
    Task,
    DashboardOverview,
    RiskAnalysisResult,
    DependencyAnalysisResult,
)
from backend.app.services.project_service import project_service, ProjectService
from backend.app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[Project])
def get_all_projects():
    """Retrieve all seeded engineering projects."""
    return project_service.list_projects()

@router.get("/{project_id}/dashboard", response_model=DashboardOverview)
def get_project_dashboard(project_id: str = Path(..., description="Project ID")):
    """Get synthesized executive dashboard metrics for the project."""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")

    # Run agent orchestrator to get telemetry
    analysis = orchestrator.run_analysis(project_id)
    risk_res = analysis.risk_analysis
    dep_res = analysis.dependency_analysis

    # Calculate status counts
    total_tasks = len(project.tasks)
    completed_count = sum(1 for t in project.tasks if t.status == "completed")
    in_progress_count = sum(1 for t in project.tasks if t.status == "in_progress")
    blocked_count = sum(1 for t in project.tasks if t.status == "blocked")
    todo_count = sum(1 for t in project.tasks if t.status == "todo")

    # Completion percentage
    completion_percent = round((completed_count / total_tasks * 100), 1) if total_tasks > 0 else 0.0

    # QA defect counts
    crit_bugs = sum(1 for b in project.qa_bugs if b.severity == "critical" and b.status != "resolved")
    high_bugs = sum(1 for b in project.qa_bugs if b.severity == "high" and b.status != "resolved")

    # Days until release
    current_d = project.current_date
    release_d = project.release_deadline
    days_left = max(0, ProjectService.days_between(current_d, release_d))

    # Health score (100 minus highest risk score, clamped 0 - 100)
    health_score = max(10, 100 - risk_res.overall_risk_score)

    # Risk distribution
    risk_dist = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for r in risk_res.risks:
        risk_dist[r.severity] = risk_dist.get(r.severity, 0) + 1

    status_dist = {
        "completed": completed_count,
        "in_progress": in_progress_count,
        "blocked": blocked_count,
        "todo": todo_count,
    }

    recent_acts = orchestrator.get_activity_history(limit=5)

    return DashboardOverview(
        project=project,
        health_status=risk_res.overall_health,
        health_score=health_score,
        sprint_completion_percent=completion_percent,
        total_tasks=total_tasks,
        completed_tasks=completed_count,
        in_progress_tasks=in_progress_count,
        blocked_tasks=blocked_count,
        todo_tasks=todo_count,
        delayed_tasks=risk_res.overdue_task_count,
        critical_bugs=crit_bugs,
        high_bugs=high_bugs,
        release_deadline=release_d,
        days_until_release=days_left,
        task_status_distribution=status_dist,
        risk_distribution=risk_dist,
        top_risks=risk_res.risks[:4],
        critical_path_tasks=dep_res.critical_release_chain,
        recent_activity=recent_acts,
    )

@router.get("/{project_id}/tasks", response_model=List[Task])
def get_project_tasks(project_id: str = Path(...)):
    """Retrieve full task list for a project."""
    tasks = project_service.get_tasks(project_id)
    if not tasks:
        raise HTTPException(status_code=404, detail=f"No tasks found for project '{project_id}'")
    return tasks

@router.get("/{project_id}/risks", response_model=RiskAnalysisResult)
def get_project_risks(project_id: str = Path(...)):
    """Run Risk Agent and return transparent risk analysis."""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    analysis = orchestrator.run_analysis(project_id)
    return analysis.risk_analysis

@router.get("/{project_id}/dependencies", response_model=DependencyAnalysisResult)
def get_project_dependencies(project_id: str = Path(...)):
    """Run Dependency Agent and return DAG telemetry and blocked paths."""
    project = project_service.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    analysis = orchestrator.run_analysis(project_id)
    return analysis.dependency_analysis

