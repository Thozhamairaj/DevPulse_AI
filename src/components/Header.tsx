import React from 'react';
import { RefreshCw, Sparkles, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Badge } from './Badge';

export const Header: React.FC = () => {
  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    currentProject,
    dashboard,
    isAnalyzing,
    triggerAgentAnalysis,
    geminiStatus,
  } = useProject();

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Project Selector & Sprint context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="project-select" className="text-xs font-medium text-slate-400">
            Project:
          </label>
          <select
            id="project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_demonstration ? '(Demo)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden md:block" />

        {currentProject && (
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-medium text-slate-300">{currentProject.sprint_name}</span>
            <span className="text-slate-600">•</span>
            <span>Target Release: <strong className="text-slate-200">{currentProject.release_deadline}</strong></span>
          </div>
        )}
      </div>

      {/* Right: Health Badge, AI Mode, and Trigger Analysis Button */}
      <div className="flex items-center gap-3">
        {dashboard && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-400">Delivery Status:</span>
            <Badge variant="health" value={dashboard.health_status}>
              <span className="flex items-center gap-1.5 uppercase font-bold text-[11px]">
                {dashboard.health_status === 'critical' ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {dashboard.health_status.replace('_', ' ')}
              </span>
            </Badge>
          </div>
        )}

        {/* AI Engine Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
          <Sparkles className={`h-3 w-3 ${geminiStatus?.configured ? 'text-sky-400' : 'text-amber-400'}`} />
          <span>
            {geminiStatus?.configured
              ? geminiStatus.model
              : 'Deterministic Rules Engine'}
          </span>
        </div>

        {/* Action Button: Run Multi-Agent Orchestrator */}
        <button
          onClick={triggerAgentAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Orchestrating Agents...' : 'Run Agent Analysis'}</span>
        </button>
      </div>
    </header>
  );
};

