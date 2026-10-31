import pytest
from backend.app.models.schemas import SimulationRequest
from backend.app.services.simulator_service import simulator_service
from backend.app.services.project_service import project_service

def test_simulator_immutability():
    """Verify simulator calculates cascading impact without mutating original tasks."""
    project = project_service.get_project("proj-ecommerce-01")
    assert project is not None

    task_101 = next(t for t in project.tasks if t.id == "TASK-101")
    original_due = task_101.due_date

    req = SimulationRequest(
        project_id="proj-ecommerce-01",
        task_id="TASK-101",
        additional_delay_days=3,
    )

    response = simulator_service.run_simulation(req)

    # Check simulated output
    assert response.simulated_task_id == "TASK-101"
    assert response.additional_delay_days == 3
    assert response.new_task_due_date != original_due
    assert response.is_simulation_only is True
    assert len(response.affected_downstream_tasks) >= 2
    assert response.release_impact.will_delay_release is True

    # Crucial check: Original task in project service must NOT be modified
    refetched_task = next(t for t in project_service.get_project("proj-ecommerce-01").tasks if t.id == "TASK-101")
    assert refetched_task.due_date == original_due
    assert refetched_task.progress == 45

