import pytest
from backend.app.models.schemas import Project, Task, QABug
from backend.app.agents.risk_agent import RiskAgent

@pytest.fixture
def sample_project():
    return Project(
        id="test-proj-01",
        name="Test E-Commerce",
        description="Test project for unit tests",
        is_demonstration=True,
        current_date="2026-10-31",
        sprint_name="Sprint 1",
        sprint_start_date="2026-10-20",
        sprint_end_date="2026-11-06",
        release_deadline="2026-11-08",
        team=[],
        tasks=[
            Task(
                id="TASK-OVERDUE",
                title="Overdue Payment Task",
                description="Needs to be done",
                assignee="Alex Chen",
                status="in_progress",
                priority="critical",
                progress=40,
                start_date="2026-10-20",
                due_date="2026-10-29",  # 2 days overdue relative to 2026-10-31
                dependencies=[],
            ),
            Task(
                id="TASK-COMPLETED",
                title="Completed Auth Task",
                description="Done",
                assignee="Alex Chen",
                status="completed",
                priority="high",
                progress=100,
                start_date="2026-10-20",
                due_date="2026-10-25",
                dependencies=[],
            ),
            Task(
                id="TASK-BLOCKED",
                title="Blocked Integration Task",
                description="Blocked on payment",
                assignee="Sarah Jenkins",
                status="blocked",
                priority="high",
                progress=0,
                start_date="2026-10-28",
                due_date="2026-11-04",
                dependencies=["TASK-OVERDUE"],
            ),
        ],
        qa_bugs=[
            QABug(
                id="BUG-01",
                title="Critical Payment Gateway Defect",
                severity="critical",
                status="open",
                related_task_id="TASK-OVERDUE",
            )
        ],
    )

def test_risk_agent_identifies_overdue_and_bugs(sample_project):
    agent = RiskAgent()
    result = agent.analyze(sample_project)

    assert result.overdue_task_count >= 1
    assert result.critical_bug_count >= 1

    # Overdue task should have high or critical risk score
    overdue_risk = next((r for r in result.risks if r.task_id == "TASK-OVERDUE"), None)
    assert overdue_risk is not None
    assert overdue_risk.risk_score >= 70
    assert overdue_risk.severity in ["critical", "high"]
    
    # Evidence must be explicit and non-empty
    assert len(overdue_risk.evidence) >= 2
    assert any("overdue" in e.lower() for e in overdue_risk.evidence)
    assert any("critical qa bug" in e.lower() for e in overdue_risk.evidence)

def test_completed_tasks_have_no_risk(sample_project):
    agent = RiskAgent()
    result = agent.analyze(sample_project)

    completed_risk = next((r for r in result.risks if r.task_id == "TASK-COMPLETED"), None)
    assert completed_risk is None

