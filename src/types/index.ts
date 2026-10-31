export type HealthStatus = 'on_track' | 'at_risk' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  priority: PriorityLevel;
  progress: number;
  start_date: string;
  due_date: string;
  dependencies: string[];
}

export interface QABug {
  id: string;
  title: string;
  severity: RiskSeverity;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  related_task_id: string;
  reported_date?: string;
  reporter?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  is_demonstration: boolean;
  current_date: string;
  sprint_name: string;
  sprint_start_date: string;
  sprint_end_date: string;
  release_deadline: string;
  team: TeamMember[];
  tasks: Task[];
  qa_bugs: QABug[];
}

export interface RiskItem {
  id: string;
  task_id: string;
  task_title: string;
  assignee: string;
  risk_score: number;
  severity: RiskSeverity;
  risk_category: 'overdue' | 'slow_progress' | 'critical_bug' | 'deadline_pressure' | 'blocked_dependency';
  evidence: string[];
  affected_downstream_task_ids: string[];
  recommended_action: string;
}

export interface RiskAnalysisResult {
  overall_health: HealthStatus;
  overall_risk_score: number;
  risks: RiskItem[];
  overdue_task_count: number;
  slow_progress_count: number;
  critical_bug_count: number;
  summary: string;
}

export interface DependencyNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  assignee: string;
  is_blocked: boolean;
  is_critical_chain: boolean;
  days_overdue: number;
  due_date: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
  status: 'active' | 'blocked' | 'cleared';
}

export interface BlockedTaskDetail {
  task_id: string;
  task_title: string;
  assignee: string;
  blocked_by: string[];
  blocker_titles: string[];
  reason: string;
}

export interface DownstreamImpact {
  source_task_id: string;
  downstream_task_ids: string[];
  downstream_task_titles: string[];
  max_chain_depth: number;
  impacts_release: boolean;
}

export interface DependencyAnalysisResult {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  blocked_tasks: BlockedTaskDetail[];
  downstream_impacts: DownstreamImpact[];
  critical_release_chain: string[];
  has_circular_dependency: boolean;
  circular_paths: string[][];
  summary: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  why_it_matters: string;
  urgency: UrgencyLevel;
  action_type: 'resource_reallocation' | 'scope_adjustment' | 'unblock_dependency' | 'qa_escalation' | 'schedule_buffer';
  target_task_id?: string;
  target_task_title?: string;
  suggested_assignee?: string;
  approval_status: ApprovalStatus;
  reviewed_at?: string;
  reviewer_comment?: string;
  projected_benefit: string;
}

export interface AgentActivityLog {
  id: string;
  agent_name: string;
  execution_status: 'running' | 'completed' | 'failed' | 'fallback';
  timestamp: string;
  duration_ms: number;
  data_analyzed: string;
  discoveries: string[];
  summary: string;
}

export interface DashboardOverview {
  project: Project;
  health_status: HealthStatus;
  health_score: number;
  sprint_completion_percent: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  blocked_tasks: number;
  todo_tasks: number;
  delayed_tasks: number;
  critical_bugs: number;
  high_bugs: number;
  release_deadline: string;
  days_until_release: number;
  task_status_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  top_risks: RiskItem[];
  critical_path_tasks: string[];
  recent_activity: AgentActivityLog[];
}

export interface SimulatedTaskImpact {
  task_id: string;
  task_title: string;
  original_due_date: string;
  projected_due_date: string;
  depth: number;
  assignee: string;
  status: string;
  is_release_blocker: boolean;
}

export interface ReleaseImpact {
  will_delay_release: boolean;
  original_deadline: string;
  projected_release_date: string;
  days_beyond_deadline: number;
  severity: RiskSeverity;
  narrative: string;
}

export interface SimulationResponse {
  project_id: string;
  simulated_task_id: string;
  simulated_task_title: string;
  additional_delay_days: number;
  original_task_due_date: string;
  new_task_due_date: string;
  affected_downstream_tasks: SimulatedTaskImpact[];
  release_impact: ReleaseImpact;
  suggested_mitigations: string[];
  is_simulation_only: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  key_takeaways?: string[];
  referenced_tasks?: string[];
  source?: 'gemini' | 'deterministic_fallback';
}

export interface ProjectAnalysisResponse {
  project_id: string;
  project_name: string;
  analyzed_at: string;
  health_status: HealthStatus;
  risk_analysis: RiskAnalysisResult;
  dependency_analysis: DependencyAnalysisResult;
  recommendations: RecommendationItem[];
  agent_activities: AgentActivityLog[];
}

