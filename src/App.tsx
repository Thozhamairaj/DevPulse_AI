import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { RiskIntelligencePage } from './pages/RiskIntelligencePage';
import { DependencyMapPage } from './pages/DependencyMapPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { WhatIfSimulatorPage } from './pages/WhatIfSimulatorPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const NotificationToast: React.FC = () => {
  const { notification, clearNotification } = useProject();

  if (!notification) return null;

  const bgStyle =
    notification.type === 'success'
      ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
      : notification.type === 'error'
      ? 'bg-rose-950 border-rose-700 text-rose-200'
      : 'bg-sky-950 border-sky-700 text-sky-200';

  const Icon =
    notification.type === 'success'
      ? CheckCircle2
      : notification.type === 'error'
      ? AlertTriangle
      : Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium ${bgStyle}`}>
        <Icon className="h-4 w-4 shrink-0" />
        <span>{notification.message}</span>
        <button
          onClick={clearNotification}
          className="ml-2 hover:opacity-75 transition-opacity cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/risks" element={<RiskIntelligencePage />} />
            <Route path="/dependencies" element={<DependencyMapPage />} />
            <Route path="/assistant" element={<AIAssistantPage />} />
            <Route path="/simulator" element={<WhatIfSimulatorPage />} />
            <Route path="/activities" element={<AgentActivityPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <AppLayout />
      </ProjectProvider>
    </BrowserRouter>
  );
}
