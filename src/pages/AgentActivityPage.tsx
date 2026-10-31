import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { AgentActivityLog } from '../types';
import apiService from '../services/api';

const AGENT_COLORS: Record<string, string> = {
  'Risk Agent': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'Dependency Agent': 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  'Recommendation Agent': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Central Orchestrator': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
};

export const AgentActivityPage: React.FC = () => {
  const { isAnalyzing, triggerAgentAnalysis } = useProject();
  const [activities, setActivities] = useState<AgentActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getAgentActivity(50);
      setActivities(res);
    } catch (err) {
      console.error('Failed to load agent activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleRunAnalysis = async () => {
    await triggerAgentAnalysis();
    await fetchActivities();
  };

  const filtered = activities.filter((act) => {
    if (selectedAgentFilter === 'all') return true;
    return act.agent_name.toLowerCase().includes(selectedAgentFilter.toLowerCase());
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Agent Activity Audit Log</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950 text-blue-300 border border-blue-800">
              Multi-Agent Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Complete execution trace recording when agents ran, input datasets, latency, and discoveries.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Executing Pipeline...' : 'Trigger Agent Run'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'all', label: 'All Agents' },
          { key: 'risk', label: 'Risk Agent' },
          { key: 'dependency', label: 'Dependency Agent' },
          { key: 'recommendation', label: 'Recommendation Agent' },
          { key: 'orchestrator', label: 'Central Orchestrator' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedAgentFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedAgentFilter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activities Timeline / Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Fetching agent execution telemetry...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((log) => {
            const badgeClass = AGENT_COLORS[log.agent_name] || 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={log.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${badgeClass}`}>
                      {log.agent_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {log.execution_status.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ({log.duration_ms} ms)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="text-xs text-slate-300">
                    <strong className="text-slate-400 font-medium">Dataset Analyzed: </strong>
                    <span className="font-mono text-slate-200">{log.data_analyzed}</span>
                  </div>

                  <p className="text-xs text-slate-300">{log.summary}</p>

                  {/* Discoveries list */}
                  {log.discoveries.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/40">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Discovered Findings:
                      </span>
                      <ul className="space-y-1">
                        {log.discoveries.map((disc, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            <span>{disc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
              <Activity className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-300">No logs found</h3>
              <p className="text-xs text-slate-500 mt-1">Try triggering a new agent run.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

