from typing import List, Dict, Set
from collections import deque
from backend.app.models.schemas import (
    SimulationRequest,
    SimulationResponse,
    SimulatedTaskImpact,
    ReleaseImpact,
    Task,
)
from backend.app.services.project_service import project_service, ProjectService

class SimulatorService:
    """
    Hypothetical What-if Schedule Simulator.
    Simulates schedule slippage and calculates cascading downstream delivery delay.
    Guaranteed immutable: Never modifies or persists changes to original tasks or project records.
    """

    def run_simulation(self, request: SimulationRequest) -> SimulationResponse:
        project = project_service.get_project(request.project_id)
        if not project:
            raise ValueError(f"Project '{request.project_id}' not found.")

        target_task: Task = next((t for t in project.tasks if t.id == request.task_id), None)
        if not target_task:
            raise ValueError(f"Task '{request.task_id}' not found in project '{request.project_id}'.")

        # 1. Pure projection: target task original vs new due date
        delay_days = request.additional_delay_days
        original_target_due = target_task.due_date
        new_target_due = ProjectService.add_days(original_target_due, delay_days)

        # 2. Build downstream dependency graph
        task_map: Dict[str, Task] = {t.id: t for t in project.tasks}
        downstream: Dict[str, List[str]] = {t.id: [] for t in project.tasks}
        for t in project.tasks:
            for dep in t.dependencies:
                if dep in downstream:
                    downstream[dep].append(t.id)

        # 3. BFS downstream propagation
        # Each downstream task inherits the slippage
        affected_impacts: List[SimulatedTaskImpact] = []
        visited: Set[str] = set()
        queue = deque([(target_task.id, 0, delay_days)])

        while queue:
            curr_id, depth, inherited_delay = queue.popleft()
            for child_id in downstream.get(curr_id, []):
                if child_id not in visited:
                    visited.add(child_id)
                    child_task = task_map.get(child_id)
                    if child_task:
                        orig_due = child_task.due_date
                        projected_due = ProjectService.add_days(orig_due, inherited_delay)
                        is_rel = (
                            "release" in child_task.title.lower()
                            or "deployment" in child_task.title.lower()
                            or child_id == project.tasks[-1].id
                        )

                        affected_impacts.append(
                            SimulatedTaskImpact(
                                task_id=child_task.id,
                                task_title=child_task.title,
                                original_due_date=orig_due,
                                projected_due_date=projected_due,
                                depth=depth + 1,
                                assignee=child_task.assignee,
                                status=child_task.status,
                                is_release_blocker=is_rel,
                            )
                        )
                        # Downstream tasks pass along the delay
                        queue.append((child_id, depth + 1, inherited_delay))

        # 4. Assess Release Deadline Impact
        release_deadline = project.release_deadline
        # Find if release task is among affected or compute max projected date on critical chain
        rel_task = next(
            (t for t in affected_impacts if t.is_release_blocker),
            None
        )

        if rel_task:
            projected_release = rel_task.projected_due_date
        else:
            # If release task wasn't directly in downstream, check if the delay pushes the latest task
            max_projected = max([t.projected_due_date for t in affected_impacts], default=new_target_due)
            projected_release = max(max_projected, release_deadline)

        days_beyond = max(0, ProjectService.days_between(release_deadline, projected_release))
        will_delay = days_beyond > 0

        if days_beyond >= 4:
            severity = "critical"
        elif days_beyond >= 2:
            severity = "high"
        elif days_beyond > 0:
            severity = "medium"
        else:
            severity = "low"

        narrative = (
            f"Simulating a +{delay_days}-day delay on '{target_task.title}' pushes its completion to {new_target_due}. "
            f"This cascades through {len(affected_impacts)} downstream task(s). "
            f"The final production release ({release_deadline}) "
            f"{f'slips by {days_beyond} day(s) to {projected_release}.' if will_delay else 'remains protected within buffer limits.'}"
        )

        mitigations = [
            f"Fast-track PR reviews and authorize daily overtime pairing for {target_task.assignee}.",
            f"Parallelize downstream testing by decoupling dependent tasks using contract test doubles.",
            f"Descope non-essential UI features to absorb the +{delay_days} day delay without moving the release deadline.",
            f"Schedule an executive stakeholder sync to announce a potential {days_beyond}-day release contingency if needed.",
        ]

        return SimulationResponse(
            project_id=project.id,
            simulated_task_id=target_task.id,
            simulated_task_title=target_task.title,
            additional_delay_days=delay_days,
            original_task_due_date=original_target_due,
            new_task_due_date=new_target_due,
            affected_downstream_tasks=affected_impacts,
            release_impact=ReleaseImpact(
                will_delay_release=will_delay,
                original_deadline=release_deadline,
                projected_release_date=projected_release,
                days_beyond_deadline=days_beyond,
                severity=severity,
                narrative=narrative,
            ),
            suggested_mitigations=mitigations,
            is_simulation_only=True,
        )

# Global simulator instance
simulator_service = SimulatorService()

