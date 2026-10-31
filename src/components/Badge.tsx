import React from 'react';
import { HealthStatus, RiskSeverity, UrgencyLevel, TaskStatus, PriorityLevel } from '../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'health' | 'severity' | 'urgency' | 'status' | 'priority' | 'neutral';
  value?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', value, className = '' }) => {
  const normalized = (value || String(children)).toLowerCase().replace(/_/g, ' ');

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'health' || variant === 'severity') {
    if (normalized.includes('critical')) {
      colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    } else if (normalized.includes('high') || normalized.includes('at risk')) {
      colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    } else if (normalized.includes('medium')) {
      colorClasses = 'bg-yellow-950/80 text-yellow-300 border-yellow-800/80';
    } else if (normalized.includes('low') || normalized.includes('on track')) {
      colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    }
  } else if (variant === 'urgency') {
    if (normalized.includes('urgent')) {
      colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse';
    } else if (normalized.includes('high')) {
      colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
    } else if (normalized.includes('medium')) {
      colorClasses = 'bg-sky-950/80 text-sky-300 border-sky-800/80';
    } else {
      colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
    }
  } else if (variant === 'status') {
    if (normalized.includes('completed')) {
      colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
    } else if (normalized.includes('blocked')) {
      colorClasses = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
    } else if (normalized.includes('in progress')) {
      colorClasses = 'bg-blue-950/80 text-blue-300 border-blue-800/80';
    } else {
      colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
};

