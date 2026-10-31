import pytest
from backend.app.models.schemas import Project, Task
from backend.app.agents.dependency_agent import DependencyAgent

def test_dependency_agent_blocked_and_downstream():
    project = Project(
        id="test-dep-01",
        name="Dep Test Project",
        description="Testing dependencies",
        is_demonstration=True,
        current_date="2026-10-31",
        sprint_name="Sprint 1",
        sprint_start_date="2026-10-20",
        sprint_end_date="2026-11-06",
        release_deadline="2026-11-08",
        team=[],
        tasks=[
            Task(
                id="TASK-A",
                title="Payment API",
                description="Core API",
                assignee="Alex Chen",
                status="in_progress",
                priority="critical",
                progress=40,
                start_date="2026-10-20",
                due_date="2026-10-29",
                dependencies=[],
            ),
            Task(
                id="TASK-B",
                title="Payment Testing",
                description="Testing API",
                assignee="Sarah Jenkins",
                status="blocked",
                priority="high",
                progress=0,
                start_date="2026-10-28",
                due_date="2026-11-02",
                dependencies=["TASK-A"],
            ),
            Task(
                id="TASK-C",
                title="Production Release",
                description="Final cutover",
                assignee="Elena Rostova",
                status="todo",
                priority="critical",
                progress=0,
                start_date="2026-11-06",
                due_date="2026-11-08",
                dependencies=["TASK-B"],
            ),
        ],
        qa_bugs=[],
    )

    agent = DependencyAgent()
    result = agent.analyze(project)

    # TASK-B should be identified as blocked by TASK-A
    blocked_ids = [b.task_id for b in result.blocked_tasks]
    assert "TASK-B" in blocked_ids

    # Downstream from TASK-A should include both TASK-B and TASK-C
    impact_a = next((d for d in result.downstream_impacts if d.source_task_id == "TASK-A"), None)
    assert impact_a is not None
    assert "TASK-B" in impact_a.downstream_task_ids
    assert "TASK-C" in impact_a.downstream_task_ids
    assert impact_a.impacts_release is True
    assert impact_a.max_chain_depth == 2

def test_circular_dependency_handling():
    """Ensure circular dependencies are detected without infinite recursion."""
    project = Project(
        id="test-circular-01",
        name="Circular Test Project",
        description="Testing circular deps",
        is_demonstration=True,
        current_date="2026-10-31",
        sprint_name="Sprint 1",
        sprint_start_date="2026-10-20",
        sprint_end_date="2026-11-06",
        release_deadline="2026-11-08",
        team=[],
        tasks=[
            Task(
                id="TASK-1",
                title="Task 1",
                description="Desc 1",
                assignee="Dev 1",
                status="in_progress",
                priority="medium",
                progress=50,
                start_date="2026-10-20",
                due_date="2026-10-25",
                dependencies=["TASK-2"],
            ),
            Task(
                id="TASK-2",
                title="Task 2",
                description="Desc 2",
                assignee="Dev 2",
                status="in_progress",
                priority="medium",
                progress=50,
                start_date="2026-10-20",
                due_date="2026-10-25",
                dependencies=["TASK-1"],
            ),
        ],
        qa_bugs=[],
    )

    agent = DependencyAgent()
    result = agent.analyze(project)

    assert result.has_circular_dependency is True
    assert len(result.circular_paths) > 0

