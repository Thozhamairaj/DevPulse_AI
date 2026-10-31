import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  Bot,
  SlidersHorizontal,
  Activity,
  CheckSquare,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const NAV_ITEMS = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Risk Intelligence', path: '/risks', icon: ShieldAlert },
  { name: 'Dependency Map', path: '/dependencies', icon: Network },
  { name: 'AI Assistant', path: '/assistant', icon: Bot, isAi: true },
  { name: 'What-if Simulator', path: '/simulator', icon: SlidersHorizontal },
  { name: 'Agent Activity', path: '/activities', icon: Activity },
  { name: 'Approvals', path: '/approvals', icon: CheckSquare },
];

export const Sidebar: React.FC = () => {
  const { currentProject, dashboard } = useProject();

  const healthColor =
    dashboard?.health_status === 'critical'
      ? 'bg-rose-500'
      : dashboard?.health_status === 'at_risk'
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0 sticky top-0 z-30">
      {/* Brand & Platform Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base tracking-tight flex items-center gap-1.5">
              DevPulse <span className="text-sky-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Engineering Delivery
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Intelligence Modules
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.isAi && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="rounded-xl p-3 bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
              {currentProject?.name || 'Loading project...'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${healthColor} animate-pulse`} />
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {dashboard?.health_status ? dashboard.health_status.replace('_', ' ') : 'Live'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Sprint Target:</span>
            <span className="text-slate-300 font-medium">{currentProject?.release_deadline || 'Nov 08'}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>Demonstration MVP</span>
            <span className="text-blue-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

