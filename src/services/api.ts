import axios from 'axios';
import {
  Project,
  DashboardOverview,
  Task,
  RiskAnalysisResult,
  DependencyAnalysisResult,
  ProjectAnalysisResponse,
  AgentActivityLog,
  RecommendationItem,
  ApprovalStatus,
  SimulationResponse,
  ChatMessage,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Health
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await api.get('/projects');
    return res.data;
  },

  getDashboard: async (projectId: string): Promise<DashboardOverview> => {
    const res = await api.get(`/projects/${projectId}/dashboard`);
    return res.data;
  },

  getTasks: async (projectId: string): Promise<Task[]> => {
    const res = await api.get(`/projects/${projectId}/tasks`);
    return res.data;
  },

  getRisks: async (projectId: string): Promise<RiskAnalysisResult> => {
    const res = await api.get(`/projects/${projectId}/risks`);
    return res.data;
  },

  getDependencies: async (projectId: string): Promise<DependencyAnalysisResult> => {
    const res = await api.get(`/projects/${projectId}/dependencies`);
    return res.data;
  },

  // Agents
  runAgentAnalysis: async (projectId: string): Promise<ProjectAnalysisResponse> => {
    const res = await api.post('/agents/analyze', { project_id: projectId });
    return res.data;
  },

  getAgentActivity: async (limit = 50): Promise<AgentActivityLog[]> => {
    const res = await api.get(`/agents/activity?limit=${limit}`);
    return res.data;
  },

  // Approvals
  getApprovals: async (): Promise<RecommendationItem[]> => {
    const res = await api.get('/approvals');
    return res.data;
  },

  updateApproval: async (
    recommendationId: string,
    status: ApprovalStatus,
    comment?: string
  ): Promise<RecommendationItem> => {
    const res = await api.post(`/approvals/${recommendationId}`, {
      status,
      comment,
    });
    return res.data;
  },

  // Simulator
  runSimulation: async (
    projectId: string,
    taskId: string,
    additionalDelayDays: number
  ): Promise<SimulationResponse> => {
    const res = await api.post('/simulator/run', {
      project_id: projectId,
      task_id: taskId,
      additional_delay_days: additionalDelayDays,
    });
    return res.data;
  },

  // Assistant Chat
  sendChatMessage: async (
    projectId: string,
    message: string,
    history: ChatMessage[] = []
  ): Promise<{
    response: string;
    key_takeaways: string[];
    referenced_tasks: string[];
    source: 'gemini' | 'deterministic_fallback';
    timestamp: string;
  }> => {
    const res = await api.post('/assistant/chat', {
      project_id: projectId,
      message,
      history: history.map((h) => ({ role: h.role, content: h.content })),
    });
    return res.data;
  },
};

export default apiService;

