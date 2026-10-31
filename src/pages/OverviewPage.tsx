import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bug,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { Badge } from '../components/Badge';

const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981', // emerald-500
  in_progress: '#3b82f6', // blue-500
  blocked: '#f43f5e', // rose-500
  todo: '#64748b', // slate-500
};

const RISK_COLORS: Record<string, string> = {
  critical: '#f43f5e', // rose-500
  high: '#f97316', // orange-500
  medium: '#eab308', // yellow-500
  low: '#10b981', // emerald-500
};

export const OverviewPage: React.FC = () => {
  const { dashboard, isLoadingDashboard, currentProject } = useProject();

  if (isLoadingDashboard || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Synthesizing delivery telemetry across agents...</p>
      </div>
    );
  }

  // Prepare chart data
  const statusChartData = Object.entries(dashboard.task_status_distribution).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
    key: status,
  }));

  const riskChartData = Object.entries(dashboard.risk_distribution).map(([severity, count]) => ({
    severity: severity.toUpperCase(),
    count,
    key: severity,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner Alert if Health is Critical */}
      {dashboard.health_status === 'critical' && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 backdrop-blur-sm flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-rose-200">
                Delivery Bottleneck Detected on Critical Release Chain
              </h3>
              <p className="text-xs text-rose-300/80 mt-1">
                <strong>TASK-101 (Payment API Development)</strong> is 2 days overdue with 1 open critical defect.
                This directly blocks <strong>TASK-102 (Integration Testing)</strong> and endangers the scheduled release on{' '}
                <strong>{dashboard.release_deadline}</strong>.
              </p>
            </div>
          </div>
          <Link
            to="/risks"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            Inspect Risks
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Page Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{dashboard.project.name}</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950 text-blue-400 border border-blue-800">
              Live Overview
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">{dashboard.project.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-right">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Target Cutover</span>
            <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              {dashboard.release_deadline} ({dashboard.days_until_release} days left)
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Health */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Health Status</span>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="health" value={dashboard.health_status}>
              <span className="capitalize">{dashboard.health_status.replace('_', ' ')}</span>
            </Badge>
            <span className="text-xs text-slate-500">{dashboard.health_score}/100</span>
          </div>
        </div>

        {/* Sprint Completion */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Sprint Completion</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-100">{dashboard.sprint_completion_percent}%</span>
            <span className="text-xs text-slate-500">
              {dashboard.completed_tasks}/{dashboard.total_tasks} Tasks
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${dashboard.sprint_completion_percent}%` }}
            />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Total Scope</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-100">{dashboard.total_tasks}</span>
            <span className="text-xs text-blue-400 font-medium">{dashboard.in_progress_tasks} active</span>
          </div>
        </div>

        {/* Delayed Tasks */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Overdue Tasks</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${dashboard.delayed_tasks > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {dashboard.delayed_tasks}
            </span>
            <span className="text-xs text-rose-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Slipped
            </span>
          </div>
        </div>

        {/* Blocked Tasks */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Blocked Tasks</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${dashboard.blocked_tasks > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {dashboard.blocked_tasks}
            </span>
            <span className="text-xs text-amber-500">Waiting</span>
          </div>
        </div>

        {/* Critical QA Defects */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Critical QA Bugs</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-xl font-bold ${dashboard.critical_bugs > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {dashboard.critical_bugs}
            </span>
            <span className="text-xs text-rose-500 flex items-center gap-1">
              <Bug className="h-3 w-3" />
              Blocker
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Task Velocity & Distribution</h3>
              <p className="text-xs text-slate-400">Current sprint task status breakdown</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Blocked
              </span>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Risk Severity Spectrum</h3>
              <p className="text-xs text-slate-400">Telemetry evaluated by Risk Agent</p>
            </div>
            <Link to="/risks" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData}>
                <XAxis dataKey="severity" stroke="#64748b" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskChartData.map((entry) => (
                    <Cell key={entry.key} fill={RISK_COLORS[entry.key] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Path Flow Card */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <h3 className="text-base font-semibold text-slate-200">Critical Release Chain at Risk</h3>
          </div>
          <Link to="/dependencies" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Open Dependency Map <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          This dependency chain dictates the final release readiness. Any slippage at the root ripples directly to cutover.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg border border-rose-500/40 bg-rose-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Root Bottleneck</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300">2d Overdue</span>
            </div>
            <div className="text-xs font-semibold text-slate-100">TASK-101: Payment API Dev</div>
            <div className="text-[11px] text-slate-400 mt-1">Alex Chen • 45% done</div>
          </div>

          <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">Direct Blocker</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">Blocked</span>
            </div>
            <div className="text-xs font-semibold text-slate-100">TASK-102: Payment Integration QA</div>
            <div className="text-[11px] text-slate-400 mt-1">Sarah Jenkins • 10% done</div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Downstream Flow</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Todo</span>
            </div>
            <div className="text-xs font-semibold text-slate-100">TASK-103: Order Workflow QA</div>
            <div className="text-[11px] text-slate-400 mt-1">Marcus Brody • 0% done</div>
          </div>

          <div className="p-3.5 rounded-lg border border-indigo-500/40 bg-indigo-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Release Target</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">Nov 08</span>
            </div>
            <div className="text-xs font-semibold text-slate-100">TASK-104: Production Deployment</div>
            <div className="text-[11px] text-slate-400 mt-1">Elena Rostova • Cutover</div>
          </div>
        </div>
      </div>

      {/* Recent Multi-Agent Activities */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-400" />
            <h3 className="text-base font-semibold text-slate-200">Recent Multi-Agent Activities</h3>
          </div>
          <Link to="/activities" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Audit Trail <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {dashboard.recent_activity.slice(0, 4).map((act) => (
            <div key={act.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="h-2 w-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{act.agent_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {act.duration_ms}ms
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{act.summary}</p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0">{act.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

