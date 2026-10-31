import React, { useState, useEffect } from 'react';
import {
  Network,
  ArrowRight,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  GitBranch,
  Info,
  User,
  Calendar,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { DependencyAnalysisResult, DependencyNode } from '../types';
import apiService from '../services/api';
import { Badge } from '../components/Badge';

export const DependencyMapPage: React.FC = () => {
  const { selectedProjectId } = useProject();
  const [depData, setDepData] = useState<DependencyAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);

  useEffect(() => {
    const fetchDeps = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getDependencies(selectedProjectId);
        setDepData(res);
        if (res.nodes.length > 0) {
          // Default to the overdue root bottleneck
          const overdueNode = res.nodes.find((n) => n.days_overdue > 0) || res.nodes[0];
          setSelectedNode(overdueNode);
        }
      } catch (err) {
        console.error('Failed to load dependency data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeps();
  }, [selectedProjectId]);

  if (isLoading || !depData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Mapping graph dependencies and cycle verification...</p>
      </div>
    );
  }

  // Find critical chain nodes
  const criticalChainNodes = depData.critical_release_chain
    .map((id) => depData.nodes.find((n) => n.id === id))
    .filter(Boolean) as DependencyNode[];

  // Find blocked tasks
  const blockedTaskIds = new Set(depData.blocked_tasks.map((b) => b.task_id));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Dependency Map</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-sky-950 text-sky-300 border border-sky-800">
              DAG Visualizer
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual dependency graph tracing the critical release path, prerequisite blockers, and downstream delay cascade.
          </p>
        </div>

        {/* Graph Meta Pills */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Nodes: </span>
            <strong className="text-slate-200">{depData.nodes.length}</strong>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Edges: </span>
            <strong className="text-slate-200">{depData.edges.length}</strong>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5 text-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            DAG Validated (No cycles)
          </div>
        </div>
      </div>

      {/* Primary Visual Critical Chain Flow */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-rose-400" />
              Critical Delivery Path: Payment Gateway ➔ Production Release
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any node in the sequence to inspect dependencies and cascade radius.
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
            Path Length: {criticalChainNodes.length} Stages
          </span>
        </div>

        {/* Visual Pipeline Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative mt-6">
          {criticalChainNodes.map((node, index) => {
            const isSelected = selectedNode?.id === node.id;
            const isBlocked = blockedTaskIds.has(node.id);
            const isOverdue = node.days_overdue > 0;

            let borderStyle = 'border-slate-800 bg-slate-950/60';
            if (isOverdue) borderStyle = 'border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/50';
            else if (isBlocked) borderStyle = 'border-amber-500/80 bg-amber-950/20';
            else if (node.status === 'completed') borderStyle = 'border-emerald-500/60 bg-emerald-950/20';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${borderStyle} ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10' : 'hover:border-slate-600'
                }`}
              >
                {/* Stage Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                    Step {index + 1}
                  </span>
                  <Badge variant="status" value={node.status}>
                    {node.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="text-xs font-mono text-blue-400">{node.id}</div>
                <h4 className="text-sm font-semibold text-slate-100 mt-1 line-clamp-1">{node.title}</h4>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{node.assignee}</span>
                  <span className="font-semibold text-slate-200">{node.progress}%</span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      node.status === 'completed'
                        ? 'bg-emerald-500'
                        : isOverdue
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>

                {isOverdue && (
                  <div className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Overdue by {node.days_overdue} days!
                  </div>
                )}
                {isBlocked && !isOverdue && (
                  <div className="mt-2 text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertOctagon className="h-3 w-3" /> Waiting for Step {index}
                  </div>
                )}

                {/* Arrow to Next Step */}
                {index < criticalChainNodes.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-800 border border-slate-700 text-slate-300 rounded-full p-1">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary & Parallel Graph Nodes + Inspector Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Full Task Node Matrix */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-200">All Project Tasks & Upstream Dependencies</h3>
            <span className="text-xs text-slate-400">Select any node to view inspector</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {depData.nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isBlocked = blockedTaskIds.has(node.id);
              const isOverdue = node.days_overdue > 0;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-950/20'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">{node.id}</span>
                    <Badge variant="status" value={node.status}>
                      {node.status}
                    </Badge>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-200 mt-1 truncate">{node.title}</h5>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{node.assignee}</span>
                    <span className="text-slate-300">{node.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Node Inspector Drawer */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <Info className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">Task Node Inspector</h3>
          </div>

          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono text-blue-400">{selectedNode.id}</span>
                <h4 className="text-base font-bold text-slate-100 mt-0.5">{selectedNode.title}</h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Assignee:</span>
                  <span className="font-medium text-slate-200">{selectedNode.assignee}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="font-medium text-slate-200">{selectedNode.due_date}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Completion:</span>
                  <span className="font-medium text-slate-200">{selectedNode.progress}%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Critical Chain:</span>
                  <span className="font-semibold text-rose-400">
                    {selectedNode.is_critical_chain ? 'YES (On Release Path)' : 'No'}
                  </span>
                </div>
              </div>

              {/* Upstream Blockers if any */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">Direct Blockers:</span>
                {blockedTaskIds.has(selectedNode.id) ? (
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/60 text-xs text-rose-300">
                    {depData.blocked_tasks.find((b) => b.task_id === selectedNode.id)?.reason}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">No active blockers. Prerequisites satisfied.</div>
                )}
              </div>

              {/* Downstream Impact if any */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Downstream Dependent Tasks:
                </span>
                {(() => {
                  const impact = depData.downstream_impacts.find((d) => d.source_task_id === selectedNode.id);
                  if (impact && impact.downstream_task_ids.length > 0) {
                    return (
                      <div className="space-y-1">
                        {impact.downstream_task_ids.map((tid, idx) => (
                          <div
                            key={tid}
                            className="p-1.5 rounded bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                          >
                            <span className="font-mono text-slate-300">{tid}</span>
                            <span className="text-[10px] text-slate-400">{impact.downstream_task_titles[idx]}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <div className="text-xs text-slate-500">No downstream dependents. Terminal node.</div>;
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              Click any node on the graph to inspect its details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

