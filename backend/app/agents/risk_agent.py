from datetime import date
from typing import List, Dict
from backend.app.models.schemas import Project, Task, QABug, RiskItem, RiskAnalysisResult
from backend.app.services.project_service import ProjectService

class RiskAgent:
    """
    Deterministic Risk Analysis Agent.
    Evaluates engineering project data using transparent mathematical and heuristic rules.
    Does not hallucinate or rely on LLM for numeric scoring.
    """

    def __init__(self, name: str = "Risk Agent"):
        self.name = name

    def analyze(self, project: Project) -> RiskAnalysisResult:
        current_date = ProjectService.parse_date(project.current_date)
        risks: List[RiskItem] = []
        
        # Index bugs by related task ID
        bugs_by_task: Dict[str, List[QABug]] = {}
        for bug in project.qa_bugs:
            if bug.status not in ["resolved", "closed"]:
                bugs_by_task.setdefault(bug.related_task_id, []).append(bug)

        overdue_count = 0
        slow_progress_count = 0
        critical_bug_count = 0

        for task in project.tasks:
            # Completed tasks carry no delivery risk
            if task.status == "completed":
                continue

            task_due = ProjectService.parse_date(task.due_date)
            task_start = ProjectService.parse_date(task.start_date)
            days_overdue = (current_date - task_due).days
            total_duration_days = max(1, (task_due - task_start).days)
            elapsed_days = max(0, (current_date - task_start).days)
            
            # Expected progress based on linear timeline
            if current_date >= task_due:
                expected_progress = 100
            else:
                expected_progress = min(100, int((elapsed_days / total_duration_days) * 100))

            task_bugs = bugs_by_task.get(task.id, [])
            crit_bugs = [b for b in task_bugs if b.severity == "critical"]
            high_bugs = [b for b in task_bugs if b.severity == "high"]

            # Calculate deterministic risk score
            score = 0
            evidence: List[str] = []
            category = "deadline_pressure"

            # 1. Overdue rule
            if days_overdue > 0:
                overdue_count += 1
                penalty = min(45, 20 + (days_overdue * 12))
                score += penalty
                category = "overdue"
                evidence.append(
                    f"Task is overdue by {days_overdue} day(s) (Due: {task.due_date}, Today: {project.current_date})."
                )

            # 2. Progress vs Expectation rule
            progress_deficit = expected_progress - task.progress
            if progress_deficit >= 25:
                slow_progress_count += 1
                penalty = min(30, int(progress_deficit * 0.45))
                score += penalty
                if category != "overdue":
                    category = "slow_progress"
                evidence.append(
                    f"Progress lag: current progress is {task.progress}%, expected {expected_progress}% ({progress_deficit}% deficit)."
                )
            elif (task_due - current_date).days <= 3 and task.progress < 50 and days_overdue <= 0:
                score += 20
                category = "deadline_pressure"
                days_left = max(0, (task_due - current_date).days)
                evidence.append(
                    f"Imminent deadline: {days_left} day(s) remaining with only {task.progress}% completion."
                )

            # 3. Critical QA Bug rule
            if crit_bugs:
                critical_bug_count += len(crit_bugs)
                score += 35 * len(crit_bugs)
                category = "critical_bug"
                for b in crit_bugs:
                    evidence.append(f"Critical QA Bug open: [{b.id}] {b.title}.")

            if high_bugs:
                score += 15 * len(high_bugs)
                for b in high_bugs:
                    evidence.append(f"High-priority QA Bug open: [{b.id}] {b.title}.")

            # 4. Blocked Status rule
            if task.status == "blocked":
                score += 25
                if category == "deadline_pressure":
                    category = "blocked_dependency"
                evidence.append(
                    f"Task is currently marked as BLOCKED pending prerequisite completion."
                )

            # 5. Priority Weight
            priority_weights = {"critical": 15, "high": 10, "medium": 5, "low": 0}
            score += priority_weights.get(task.priority, 0)

            # Clamp score 0 - 100
            score = max(0, min(100, score))

            # Severity mapping
            if score >= 75:
                severity = "critical"
            elif score >= 55:
                severity = "high"
            elif score >= 30:
                severity = "medium"
            else:
                severity = "low"

            # Determine deterministic recommended action
            if "critical_bug" in category:
                rec_action = f"Pair senior engineer with QA to unblock {task.title} and patch {crit_bugs[0].id} immediately."
            elif category == "overdue":
                rec_action = f"Reallocate secondary resources or split non-critical requirements from {task.title} to deliver by EOD."
            elif category == "blocked_dependency":
                rec_action = f"Escalate prerequisite blockers for {task.title} and use mock interfaces to unblock testing."
            elif category == "slow_progress":
                rec_action = f"Conduct mid-sprint review with {task.assignee} to assess scope reduction or support needs."
            else:
                rec_action = f"Monitor daily velocity and prioritize completion before the sprint cutoff."

            # Only record if there is demonstrable risk (score >= 25 or overdue or blocked)
            if score >= 25 or days_overdue > 0 or task.status == "blocked" or crit_bugs:
                risks.append(
                    RiskItem(
                        id=f"RISK-{task.id}",
                        task_id=task.id,
                        task_title=task.title,
                        assignee=task.assignee,
                        risk_score=score,
                        severity=severity,
                        risk_category=category,
                        evidence=evidence,
                        affected_downstream_task_ids=[],  # Filled by Dependency Agent
                        recommended_action=rec_action,
                    )
                )

        # Sort risks descending by risk score
        risks.sort(key=lambda r: r.risk_score, reverse=True)

        # Determine overall project health
        max_score = max((r.risk_score for r in risks), default=0)
        critical_risks = [r for r in risks if r.severity == "critical"]
        high_risks = [r for r in risks if r.severity == "high"]

        if critical_risks or max_score >= 75 or len(high_risks) >= 2:
            overall_health = "critical"
        elif high_risks or len(risks) >= 3 or max_score >= 50:
            overall_health = "at_risk"
        else:
            overall_health = "on_track"

        summary = (
            f"Detected {len(risks)} project risk(s) across {len(project.tasks)} tasks. "
            f"Identified {overdue_count} overdue task(s), {critical_bug_count} critical QA bug(s), "
            f"and {len(critical_risks)} critical severity risk(s)."
        )

        return RiskAnalysisResult(
            overall_health=overall_health,
            overall_risk_score=max_score,
            risks=risks,
            overdue_task_count=overdue_count,
            slow_progress_count=slow_progress_count,
            critical_bug_count=critical_bug_count,
            summary=summary,
        )

