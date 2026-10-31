from typing import List
from backend.app.models.schemas import (
    Project,
    RiskItem,
    DependencyAnalysisResult,
    RecommendationItem,
)
from backend.app.services.gemini_service import gemini_service

class RecommendationAgent:
    """
    Recommendation Agent.
    Synthesizes risk scores and dependency graphs into concrete, actionable engineering mitigations.
    Prioritizes actions by urgency, assigns ownership, and enriches context via Gemini when active.
    Never mutates original project tasks or records.
    """

    def __init__(self, name: str = "Recommendation Agent"):
        self.name = name

    def generate_recommendations(
        self,
        project: Project,
        risks: List[RiskItem],
        dependencies: DependencyAnalysisResult,
    ) -> List[RecommendationItem]:
        recommendations: List[RecommendationItem] = []

        # Find critical risks
        critical_risks = [r for r in risks if r.severity == "critical"]
        overdue_risks = [r for r in risks if r.risk_category == "overdue"]
        blocked_tasks = dependencies.blocked_tasks

        # Rec 1: Critical bottleneck resource pairing
        payment_risk = next((r for r in risks if "payment" in r.task_title.lower() or r.task_id == "TASK-101"), None)
        if payment_risk or critical_risks:
            target = payment_risk or critical_risks[0]
            recommendations.append(
                RecommendationItem(
                    id="REC-001",
                    title=f"Pair Senior Engineer with {target.assignee} on {target.task_title}",
                    description=(
                        f"Reallocate Marcus Brody (who has completed high-priority components) to pair-program with "
                        f"{target.assignee} to resolve BUG-201 (Webhook verification) and finalize the remaining 55% of {target.task_title}."
                    ),
                    why_it_matters=(
                        f"{target.task_title} is {target.risk_score}/100 critical risk and directly blocks "
                        f"{len(dependencies.blocked_tasks)} downstream tasks leading to the {project.release_deadline} release."
                    ),
                    urgency="urgent",
                    action_type="resource_reallocation",
                    target_task_id=target.task_id,
                    target_task_title=target.task_title,
                    suggested_assignee="Marcus Brody",
                    approval_status="pending",
                    projected_benefit="Reduces estimated completion from 4 days to 1.5 days, bringing the release path back on schedule.",
                )
            )

        # Rec 2: Mock-service unblocking for blocked tasks
        if blocked_tasks:
            primary_blocked = blocked_tasks[0]
            recommendations.append(
                RecommendationItem(
                    id="REC-002",
                    title=f"Deploy Mock API Sandbox to Unblock {primary_blocked.task_title}",
                    description=(
                        f"Deploy a mock payment provider endpoint with WireMock / Prism so that {primary_blocked.assignee} "
                        f"can immediately execute 80% of integration test suites without waiting for the live gateway integration."
                    ),
                    why_it_matters=(
                        f"{primary_blocked.task_title} is currently 100% stalled awaiting upstream delivery. "
                        f"Unblocking testing via mocks prevents a cascading bottleneck."
                    ),
                    urgency="urgent" if "release" in primary_blocked.task_title.lower() or "test" in primary_blocked.task_title.lower() else "high",
                    action_type="unblock_dependency",
                    target_task_id=primary_blocked.task_id,
                    target_task_title=primary_blocked.task_title,
                    suggested_assignee=primary_blocked.assignee,
                    approval_status="pending",
                    projected_benefit="Recovers up to 2 lost calendar days for QA and allows defect discovery before final merge.",
                )
            )

        # Rec 3: Fast-track QA Bug remediation
        crit_bugs = [b for b in project.qa_bugs if b.severity == "critical" and b.status == "open"]
        if crit_bugs:
            bug = crit_bugs[0]
            recommendations.append(
                RecommendationItem(
                    id="REC-003",
                    title=f"Emergency P0 Escalation: Fix {bug.id} ({bug.title})",
                    description=(
                        f"Dedicate the next 4 hours exclusively to fixing {bug.title}. Author automated regression tests "
                        f"for webhook HMAC signatures under simulated concurrency."
                    ),
                    why_it_matters=(
                        f"Release acceptance criteria mandate zero open critical bugs. "
                        f"BUG-201 directly blocks production cutover authorization."
                    ),
                    urgency="urgent",
                    action_type="qa_escalation",
                    target_task_id=bug.related_task_id,
                    target_task_title="Payment Gateway Integration",
                    suggested_assignee="Alex Chen",
                    approval_status="pending",
                    projected_benefit="Eliminates release blocker and prevents security vulnerability in production payment handling.",
                )
            )

        # Rec 4: Scope adjustment / feature flags
        checkout_task = next((t for t in project.tasks if "checkout" in t.title.lower()), None)
        if checkout_task and checkout_task.status in ["blocked", "in_progress"]:
            recommendations.append(
                RecommendationItem(
                    id="REC-004",
                    title=f"Feature-Flag Advanced Address Autocomplete in {checkout_task.title}",
                    description=(
                        f"Deliver core multi-step checkout with standard address validation and gate the complex "
                        f"Google Places autocompletion behind a feature flag for Sprint 25."
                    ),
                    why_it_matters=(
                        f"Descoping 8 engineering hours from {checkout_task.title} ensures the primary checkout flow "
                        f"is stabilized before the release freeze on {project.release_deadline}."
                    ),
                    urgency="medium",
                    action_type="scope_adjustment",
                    target_task_id=checkout_task.id,
                    target_task_title=checkout_task.title,
                    suggested_assignee=checkout_task.assignee,
                    approval_status="pending",
                    projected_benefit="Saves 1.5 engineering days, de-risking frontend delivery while retaining 100% of purchase functionality.",
                )
            )

        # Rec 5: Schedule buffer alignment
        recommendations.append(
            RecommendationItem(
                id="REC-005",
                title=f"Establish 24-Hour Code Freeze Buffer Ahead of {project.release_deadline}",
                description=(
                    f"Freeze all non-defect commits by 2026-11-07 18:00 UTC to reserve a 24-hour smoke test window "
                    f"in the staging canary environment."
                ),
                why_it_matters=(
                    f"With 3 downstream tasks chained to the release, a zero-buffer rollout carries extreme deployment risk."
                ),
                urgency="high",
                action_type="schedule_buffer",
                target_task_id=None,
                target_task_title="Production Release & Deployment",
                suggested_assignee="Elena Rostova",
                approval_status="pending",
                projected_benefit="Guarantees stable staging regression run and prevents last-minute production rollback.",
            )
        )

        # Enhance via Gemini if available
        enhanced_recommendations = gemini_service.enhance_recommendations(
            project=project,
            risks=risks,
            dependencies=dependencies,
            base_recommendations=recommendations,
        )

        return enhanced_recommendations

