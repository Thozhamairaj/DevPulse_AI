from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# --- Basic Project Models ---

class TeamMember(BaseModel):
    id: str
    name: str
    role: str
    avatar: Optional[str] = None
    email: Optional[str] = None

class Task(BaseModel):
    id: str
    title: str
    description: str
    assignee: str
    status: Literal["todo", "in_progress", "blocked", "completed"]
    priority: Literal["low", "medium", "high", "critical"]
    progress: int = Field(ge=0, le=100)
    start_date: str
    due_date: str
    dependencies: List[str] = Field(default_factory=list)

class QABug(BaseModel):
    id: str
    title: str
    severity: Literal["low", "medium", "high", "critical"]
    status: Literal["open", "in_progress", "resolved", "closed"]
    related_task_id: str
    reported_date: Optional[str] = None
    reporter: Optional[str] = None

class Project(BaseModel):
    id: str
    name: str
    description: str
    is_demonstration: bool = True
    current_date: str
    sprint_name: str
    sprint_start_date: str
    sprint_end_date: str
    release_deadline: str
    team: List[TeamMember] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    qa_bugs: List[QABug] = Field(default_factory=list)

# --- Risk Analysis Models ---

class RiskItem(BaseModel):
    id: str
    task_id: str
    task_title: str
    assignee: str
    risk_score: int = Field(ge=0, le=100)
    severity: Literal["low", "medium", "high", "critical"]
    risk_category: Literal["overdue", "slow_progress", "critical_bug", "deadline_pressure", "blocked_dependency"]
    evidence: List[str]
    affected_downstream_task_ids: List[str] = Field(default_factory=list)
    recommended_action: str

class RiskAnalysisResult(BaseModel):
    overall_health: Literal["on_track", "at_risk", "critical"]
    overall_risk_score: int
    risks: List[RiskItem]
    overdue_task_count: int
    slow_progress_count: int
    critical_bug_count: int
    summary: str

# --- Dependency Models ---

class DependencyNode(BaseModel):
    id: str
    title: str
    status: str
    priority: str
    progress: int
    assignee: str
    is_blocked: bool
    is_critical_chain: bool
    days_overdue: int = 0
    due_date: str

class DependencyEdge(BaseModel):
    source: str
    target: str
    status: Literal["active", "blocked", "cleared"]

class BlockedTaskDetail(BaseModel):
    task_id: str
    task_title: str
    assignee: str
    blocked_by: List[str]
    blocker_titles: List[str]
    reason: str

class DownstreamImpact(BaseModel):
    source_task_id: str
    downstream_task_ids: List[str]
    downstream_task_titles: List[str]
    max_chain_depth: int
    impacts_release: bool

class DependencyAnalysisResult(BaseModel):
    nodes: List[DependencyNode]
    edges: List[DependencyEdge]
    blocked_tasks: List[BlockedTaskDetail]
    downstream_impacts: List[DownstreamImpact]
    critical_release_chain: List[str]
    has_circular_dependency: bool = False
    circular_paths: List[List[str]] = Field(default_factory=list)
    summary: str

# --- Recommendation & Approvals Models ---

class RecommendationItem(BaseModel):
    id: str
    title: str
    description: str
    why_it_matters: str
    urgency: Literal["low", "medium", "high", "urgent"]
    action_type: Literal["resource_reallocation", "scope_adjustment", "unblock_dependency", "qa_escalation", "schedule_buffer"]
    target_task_id: Optional[str] = None
    target_task_title: Optional[str] = None
    suggested_assignee: Optional[str] = None
    approval_status: Literal["pending", "approved", "rejected"] = "pending"
    reviewed_at: Optional[str] = None
    reviewer_comment: Optional[str] = None
    projected_benefit: str

class ApprovalUpdate(BaseModel):
    status: Literal["approved", "rejected"]
    comment: Optional[str] = None

# --- Orchestrator & Agent Activity Models ---

class AgentActivityLog(BaseModel):
    id: str
    agent_name: str
    execution_status: Literal["running", "completed", "failed", "fallback"]
    timestamp: str
    duration_ms: int
    data_analyzed: str
    discoveries: List[str]
    summary: str

class ProjectAnalysisResponse(BaseModel):
    project_id: str
    project_name: str
    analyzed_at: str
    health_status: Literal["on_track", "at_risk", "critical"]
    risk_analysis: RiskAnalysisResult
    dependency_analysis: DependencyAnalysisResult
    recommendations: List[RecommendationItem]
    agent_activities: List[AgentActivityLog]

# --- What-if Simulation Models ---

class SimulationRequest(BaseModel):
    project_id: str
    task_id: str
    additional_delay_days: int = Field(ge=1, le=30)

class SimulatedTaskImpact(BaseModel):
    task_id: str
    task_title: str
    original_due_date: str
    projected_due_date: str
    depth: int
    assignee: str
    status: str
    is_release_blocker: bool

class ReleaseImpact(BaseModel):
    will_delay_release: bool
    original_deadline: str
    projected_release_date: str
    days_beyond_deadline: int
    severity: Literal["low", "medium", "high", "critical"]
    narrative: str

class SimulationResponse(BaseModel):
    project_id: str
    simulated_task_id: str
    simulated_task_title: str
    additional_delay_days: int
    original_task_due_date: str
    new_task_due_date: str
    affected_downstream_tasks: List[SimulatedTaskImpact]
    release_impact: ReleaseImpact
    suggested_mitigations: List[str]
    is_simulation_only: bool = True

# --- AI Assistant Models ---

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    project_id: str
    message: str
    history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    response: str
    key_takeaways: List[str] = Field(default_factory=list)
    referenced_tasks: List[str] = Field(default_factory=list)
    source: Literal["gemini", "deterministic_fallback"]
    timestamp: str

# --- Dashboard Overview Models ---

class DashboardOverview(BaseModel):
    project: Project
    health_status: Literal["on_track", "at_risk", "critical"]
    health_score: int
    sprint_completion_percent: float
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    blocked_tasks: int
    todo_tasks: int
    delayed_tasks: int
    critical_bugs: int
    high_bugs: int
    release_deadline: str
    days_until_release: int
    task_status_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    top_risks: List[RiskItem]
    critical_path_tasks: List[str]
    recent_activity: List[AgentActivityLog]

