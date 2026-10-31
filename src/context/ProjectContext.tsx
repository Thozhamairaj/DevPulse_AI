import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, DashboardOverview, HealthStatus } from '../types';
import apiService from '../services/api';

interface ProjectContextType {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  currentProject: Project | null;
  dashboard: DashboardOverview | null;
  isLoadingDashboard: boolean;
  isAnalyzing: boolean;
  geminiStatus: {
    configured: boolean;
    model: string;
    mode: string;
  } | null;
  refreshDashboard: () => Promise<void>;
  triggerAgentAnalysis: () => Promise<void>;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  clearNotification: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-ecommerce-01');
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    configured: boolean;
    model: string;
    mode: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const clearNotification = () => setNotification(null);

  // Load initial health & projects
  useEffect(() => {
    const init = async () => {
      try {
        const health = await apiService.getHealth();
        setGeminiStatus(health.gemini_service);

        const projs = await apiService.getProjects();
        setProjects(projs);
        if (projs.length > 0 && !projs.find((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial project data:', err);
      }
    };
    init();
  }, []);

  // Fetch dashboard when selectedProjectId changes
  const refreshDashboard = async () => {
    if (!selectedProjectId) return;
    setIsLoadingDashboard(true);
    try {
      const data = await apiService.getDashboard(selectedProjectId);
      setDashboard(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to fetch project dashboard data',
      });
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    refreshDashboard();
  }, [selectedProjectId]);

  const triggerAgentAnalysis = async () => {
    if (!selectedProjectId) return;
    setIsAnalyzing(true);
    try {
      const analysis = await apiService.runAgentAnalysis(selectedProjectId);
      setNotification({
        type: 'success',
        message: `Agent Pipeline Complete: ${analysis.recommendations.length} recommendations formulated.`,
      });
      await refreshDashboard();
    } catch (err: any) {
      console.error('Agent analysis failed:', err);
      setNotification({
        type: 'error',
        message: err.response?.data?.detail || 'Multi-agent analysis encountered an error.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId) || dashboard?.project || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        setSelectedProjectId,
        currentProject,
        dashboard,
        isLoadingDashboard,
        isAnalyzing,
        geminiStatus,
        refreshDashboard,
        triggerAgentAnalysis,
        notification,
        clearNotification,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

