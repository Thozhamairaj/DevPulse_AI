import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  TrendingUp,
  User,
  GitFork,
  Lightbulb,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { RiskItem, RiskAnalysisResult } from '../types';
import apiService from '../services/api';
import { Badge } from '../components/Badge';

export const RiskIntelligencePage: React.FC = () => {
  const { selectedProjectId, currentProject } = useProject();
  const [riskData, setRiskData] = useState<RiskAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchRisks = async () => {
      setIsLoading(true);
      try {
        const res = await apiService.getRisks(selectedProjectId);
        setRiskData(res);
      } catch (err) {
        console.error('Failed to load risk data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRisks();
  }, [selectedProjectId]);

  if (isLoading || !riskData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Evaluating deterministic risk telemetry...</p>
      </div>
    );
  }

  // Filter risks
  const filteredRisks = riskData.risks.filter((risk) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return risk.severity === 'critical';
    if (filter === 'high') return risk.severity === 'high';
    if (filter === 'medium') return risk.severity === 'medium';
    if (filter === 'overdue') return risk.risk_category === 'overdue';
    if (filter === 'blocked') return risk.risk_category === 'blocked_dependency';
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Risk Intelligence</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800">
              Deterministic Rules Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time delivery risk scores, transparent formula breakdowns, and downstream cascade analysis.
          </p>
        </div>

        {/* Risk Stats Summary Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400">Total Risks: </span>
            <strong className="text-slate-200">{riskData.risks.length}</strong>
          </div>
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-lg px-3 py-1.5 text-xs text-rose-300 font-semibold">
            <span>Critical: </span>
            <span>{riskData.risks.filter((r) => r.severity === 'critical').length}</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-semibold">
            <span>High: </span>
            <span>{riskData.risks.filter((r) => r.severity === 'high').length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'all', label: `All Risks (${riskData.risks.length})` },
          { key: 'critical', label: 'Critical Severity' },
          { key: 'high', label: 'High Severity' },
          { key: 'medium', label: 'Medium' },
          { key: 'overdue', label: 'Overdue Tasks' },
          { key: 'blocked', label: 'Blocked Tasks' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Risks Grid */}
      <div className="space-y-4">
        {filteredRisks.map((risk) => {
          const scorePercent = risk.risk_score;
          const scoreColor =
            risk.severity === 'critical'
              ? 'bg-rose-500'
              : risk.severity === 'high'
              ? 'bg-amber-500'
              : risk.severity === 'medium'
              ? 'bg-yellow-500'
              : 'bg-emerald-500';

          return (
            <div
              key={risk.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-6 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Task & Severity */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                      {risk.task_id}
                    </span>
                    <h3 className="text-base font-semibold text-slate-100">{risk.task_title}</h3>
                    <Badge variant="severity" value={risk.severity}>
                      {risk.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 capitalize">
                      {risk.risk_category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      Assignee: <strong className="text-slate-300 font-medium">{risk.assignee}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Risk Score Gauge */}
                <div className="lg:w-56 shrink-0 bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Risk Score:</span>
                    <span className="font-mono font-bold text-base text-slate-200">{risk.risk_score}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor} transition-all duration-500`}
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block text-right">
                    Calculated deterministically
                  </span>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Transparent Telemetry Evidence
                </span>
                <ul className="space-y-1.5">
                  {risk.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Affected Downstream & Recommended Action */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Downstream Tasks */}
                <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                    <GitFork className="h-3.5 w-3.5 text-sky-400" />
                    Cascading Downstream Impact
                  </div>
                  {risk.affected_downstream_task_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {risk.affected_downstream_task_ids.map((tid) => (
                        <span
                          key={tid}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {tid}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No dependent downstream tasks identified.</span>
                  )}
                </div>

                {/* Recommended Action */}
                <div className="bg-blue-950/20 border border-blue-900/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                    Recommended Action
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{risk.recommended_action}</p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRisks.length === 0 && (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
            <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-200">No risks match this filter</h3>
            <p className="text-xs text-slate-400 mt-1">Try selecting 'All Risks' to view all telemetry.</p>
          </div>
        )}
      </div>
    </div>
  );
};

