import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  PlayCircle,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  GitCommit,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Task, SimulationResponse } from '../types';
import apiService from '../services/api';
import { Badge } from '../components/Badge';

export const WhatIfSimulatorPage: React.FC = () => {
  const { selectedProjectId, currentProject } = useProject();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('TASK-101');
  const [delayDays, setDelayDays] = useState<number>(2);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const t = await apiService.getTasks(selectedProjectId);
        setTasks(t);
        // Default to overdue Payment API
        const defaultTask = t.find((task) => task.id === 'TASK-101') || t[0];
        if (defaultTask) setSelectedTaskId(defaultTask.id);
      } catch (err) {
        console.error('Failed to load tasks for simulator:', err);
      }
    };
    fetchTasks();
  }, [selectedProjectId]);

  const runSimulation = async () => {
    if (!selectedTaskId) return;
    setIsSimulating(true);
    try {
      const res = await apiService.runSimulation(selectedProjectId, selectedTaskId, delayDays);
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation execution failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run automatically on first mount
  useEffect(() => {
    if (selectedTaskId) {
      runSimulation();
    }
  }, [selectedTaskId]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">What-if Delivery Simulator</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              Zero-Side-Effect Sandbox
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate schedule slippage scenarios on key tasks and project cascading downstream delays and release cutover impact.
          </p>
        </div>

        {/* Immutability Guarantee Banner */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Simulation Only: Live sprint data is never modified.</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-400" />
          Simulation Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Task Selector */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Target Task to Delay:</label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.id}] {t.title} ({t.assignee} • {t.status})
                </option>
              ))}
            </select>
          </div>

          {/* Delay Stepper / Slider */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-slate-400">Additional Delay:</label>
              <strong className="text-blue-400 font-mono text-sm">+{delayDays} Days</strong>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>+1 day</span>
              <span>+7 days</span>
              <span>+14 days</span>
            </div>
          </div>

          {/* Run Button */}
          <div className="md:col-span-2">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <PlayCircle className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating...' : 'Run Scenario'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Release Cutover Impact Alert */}
          <div
            className={`rounded-xl border p-6 backdrop-blur-sm ${
              simulationResult.release_impact.will_delay_release
                ? 'border-rose-500/40 bg-rose-950/20'
                : 'border-emerald-500/40 bg-emerald-950/20'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="severity"
                    value={simulationResult.release_impact.severity}
                  >
                    {simulationResult.release_impact.severity.toUpperCase()} IMPACT
                  </Badge>
                  <span className="text-xs text-slate-400">Hypothetical Projection</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100">
                  {simulationResult.release_impact.will_delay_release
                    ? `Production Release Slippage: +${simulationResult.release_impact.days_beyond_deadline} Day(s)`
                    : 'Release Deadline Protected'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {simulationResult.release_impact.narrative}
                </p>
              </div>

              {/* Date Comparison Box */}
              <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4 shrink-0">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-medium">Original Target</span>
                  <span className="text-sm font-bold text-slate-300">
                    {simulationResult.release_impact.original_deadline}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600" />
                <div>
                  <span className="text-[10px] text-rose-400 uppercase block font-medium">Projected Cutover</span>
                  <span className="text-sm font-bold text-rose-300">
                    {simulationResult.release_impact.projected_release_date}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cascading Downstream Tasks Table */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-200">Cascading Downstream Schedule Impact</h3>
                <p className="text-xs text-slate-400">
                  {simulationResult.affected_downstream_tasks.length} tasks directly delayed along the dependency tree
                </p>
              </div>
            </div>

            {simulationResult.affected_downstream_tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Depth</th>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Original Due</th>
                      <th className="py-3 px-4">Projected Due</th>
                      <th className="py-3 px-4">Release Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {simulationResult.affected_downstream_tasks.map((item) => (
                      <tr key={item.task_id} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono text-slate-400">Tier {item.depth}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-blue-400 font-semibold mr-1.5">{item.task_id}</span>
                          <span className="font-medium text-slate-200">{item.task_title}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{item.assignee}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{item.original_due_date}</td>
                        <td className="py-3 px-4 font-mono text-rose-300 font-semibold">
                          {item.projected_due_date}
                        </td>
                        <td className="py-3 px-4">
                          {item.is_release_blocker ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              Direct Release Gate
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Downstream Flow</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                This task has no dependent downstream tasks. The delay does not cascade to other components.
              </div>
            )}
          </div>

          {/* Strategic Mitigations Grid */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Suggested Scenario Mitigations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulationResult.suggested_mitigations.map((mitigation, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3"
                >
                  <span className="h-5 w-5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

