from typing import List, Dict, Set, Optional
from collections import deque
from backend.app.models.schemas import (
    Project,
    Task,
    DependencyNode,
    DependencyEdge,
    BlockedTaskDetail,
    DownstreamImpact,
    DependencyAnalysisResult,
    RiskItem,
)
from backend.app.services.project_service import ProjectService

class DependencyAgent:
    """
    Dependency Analysis Agent.
    Constructs a directed acyclic graph (DAG) of project tasks, performs cycle detection,
    computes blocked task statuses, traces multi-tier downstream impact chains,
    and identifies release bottlenecks.
    """

    def __init__(self, name: str = "Dependency Agent"):
        self.name = name

    def analyze(self, project: Project, risks: Optional[List[RiskItem]] = None) -> DependencyAnalysisResult:
        task_map: Dict[str, Task] = {t.id: t for t in project.tasks}
        current_date = ProjectService.parse_date(project.current_date)
        
        # Build adjacency maps:
        # upstream: task_id -> list of tasks it depends on (prerequisites)
        # downstream: task_id -> list of tasks that depend on it (dependents)
        upstream: Dict[str, List[str]] = {t.id: [] for t in project.tasks}
        downstream: Dict[str, List[str]] = {t.id: [] for t in project.tasks}
        
        for task in project.tasks:
            for dep_id in task.dependencies:
                if dep_id in task_map:
                    upstream[task.id].append(dep_id)
                    downstream[dep_id].append(task.id)

        # 1. Cycle Detection using DFS
        has_circular, circular_paths = self._detect_cycles(upstream)

        # 2. Blocked Tasks Detection
        blocked_tasks: List[BlockedTaskDetail] = []
        for task in project.tasks:
            uncompleted_blockers = []
            blocker_titles = []
            for dep_id in upstream[task.id]:
                dep_task = task_map.get(dep_id)
                if dep_task and dep_task.status != "completed":
                    uncompleted_blockers.append(dep_id)
                    blocker_titles.append(f"{dep_task.title} ({dep_task.status})")

            if uncompleted_blockers:
                blocked_tasks.append(
                    BlockedTaskDetail(
                        task_id=task.id,
                        task_title=task.title,
                        assignee=task.assignee,
                        blocked_by=uncompleted_blockers,
                        blocker_titles=blocker_titles,
                        reason=f"Waiting for {len(uncompleted_blockers)} incomplete prerequisite(s): {', '.join(blocker_titles)}",
                    )
                )

        # 3. Identify Critical Release Chain
        # Find any task with title containing 'release' or 'deployment' or marked critical with no downstream
        release_task = None
        for t in project.tasks:
            if "release" in t.title.lower() or "deployment" in t.title.lower():
                release_task = t
                break
        
        critical_chain: List[str] = []
        if release_task:
            critical_chain = self._trace_upstream_chain(release_task.id, upstream)

        # 4. Multi-level Downstream Impact Tracing
        downstream_impacts: List[DownstreamImpact] = []
        downstream_cache: Dict[str, List[str]] = {}

        for task in project.tasks:
            impacted_ids, max_depth = self._find_all_downstream(task.id, downstream)
            downstream_cache[task.id] = impacted_ids

            impacts_rel = any(
                "release" in task_map[tid].title.lower() or "deployment" in task_map[tid].title.lower()
                for tid in impacted_ids
                if tid in task_map
            )

            if impacted_ids:
                downstream_impacts.append(
                    DownstreamImpact(
                        source_task_id=task.id,
                        downstream_task_ids=impacted_ids,
                        downstream_task_titles=[task_map[tid].title for tid in impacted_ids if tid in task_map],
                        max_chain_depth=max_depth,
                        impacts_release=impacts_rel,
                    )
                )

        # 5. Enrich Risk Items with Downstream Impact
        if risks:
            for risk in risks:
                downstream_ids = downstream_cache.get(risk.task_id, [])
                risk.affected_downstream_task_ids = downstream_ids

        # 6. Build Nodes & Edges for Visual Dependency Graph
        nodes: List[DependencyNode] = []
        for task in project.tasks:
            due = ProjectService.parse_date(task.due_date)
            days_overdue = max(0, (current_date - due).days) if task.status != "completed" else 0
            is_blocked = any(b.task_id == task.id for b in blocked_tasks)
            is_crit = task.id in critical_chain

            nodes.append(
                DependencyNode(
                    id=task.id,
                    title=task.title,
                    status=task.status,
                    priority=task.priority,
                    progress=task.progress,
                    assignee=task.assignee,
                    is_blocked=is_blocked,
                    is_critical_chain=is_crit,
                    days_overdue=days_overdue,
                    due_date=task.due_date,
                )
            )

        edges: List[DependencyEdge] = []
        for task in project.tasks:
            for dep_id in task.dependencies:
                dep_task = task_map.get(dep_id)
                if dep_task:
                    if dep_task.status == "completed":
                        edge_status = "cleared"
                    elif dep_task.status in ["in_progress", "todo"] and days_overdue > 0:
                        edge_status = "blocked"
                    else:
                        edge_status = "active"

                    edges.append(
                        DependencyEdge(
                            source=dep_id,
                            target=task.id,
                            status=edge_status,
                        )
                    )

        summary = (
            f"Analyzed {len(project.tasks)} tasks and {len(edges)} dependency relationships. "
            f"Found {len(blocked_tasks)} blocked task(s) and critical release chain of depth {len(critical_chain)}. "
            f"Circular dependencies: {'DETECTED' if has_circular else 'None'}."
        )

        return DependencyAnalysisResult(
            nodes=nodes,
            edges=edges,
            blocked_tasks=blocked_tasks,
            downstream_impacts=downstream_impacts,
            critical_release_chain=critical_chain,
            has_circular_dependency=has_circular,
            circular_paths=circular_paths,
            summary=summary,
        )

    def _detect_cycles(self, upstream: Dict[str, List[str]]):
        """Standard DFS graph cycle detection with path backtracking."""
        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        circular_paths: List[List[str]] = []

        def dfs(node: str, current_path: List[str]):
            visited.add(node)
            rec_stack.add(node)
            current_path.append(node)

            for prereq in upstream.get(node, []):
                if prereq not in visited:
                    dfs(prereq, current_path)
                elif prereq in rec_stack:
                    # Found cycle
                    cycle_start_idx = current_path.index(prereq)
                    circular_paths.append(list(current_path[cycle_start_idx:]) + [prereq])

            rec_stack.remove(node)
            current_path.pop()

        for node in list(upstream.keys()):
            if node not in visited:
                dfs(node, [])

        return len(circular_paths) > 0, circular_paths

    def _find_all_downstream(self, start_node: str, downstream: Dict[str, List[str]]):
        """BFS downstream reachability with loop safety."""
        visited: Set[str] = set()
        queue = deque([(start_node, 0)])
        result: List[str] = []
        max_depth = 0

        while queue:
            curr, depth = queue.popleft()
            max_depth = max(max_depth, depth)

            for child in downstream.get(curr, []):
                if child not in visited:
                    visited.add(child)
                    result.append(child)
                    queue.append((child, depth + 1))

        return result, max_depth

    def _trace_upstream_chain(self, target_node: str, upstream: Dict[str, List[str]]) -> List[str]:
        """Traces the longest upstream chain leading to target_node."""
        chain: List[str] = []
        visited: Set[str] = set()

        def dfs(curr: str):
            visited.add(curr)
            parents = upstream.get(curr, [])
            if not parents:
                return [curr]
            
            longest_parent_chain = []
            for p in parents:
                if p not in visited:
                    sub = dfs(p)
                    if len(sub) > len(longest_parent_chain):
                        longest_parent_chain = sub
            return longest_parent_chain + [curr]

        chain = dfs(target_node)
        return chain

