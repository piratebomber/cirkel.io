import { create } from 'zustand';
import { CRMIntegration, Lead, SalesFunnel, TeamWorkspace } from '@/types/web3';

interface EnterpriseState {
  crmIntegrations: CRMIntegration[];
  leads: Lead[];
  salesFunnels: SalesFunnel[];
  workspaces: TeamWorkspace[];
  currentWorkspace: TeamWorkspace | null;
  
  // Actions
  setupCRMIntegration: (platform: string, config: any) => Promise<void>;
  syncCRMData: (integrationId: string) => Promise<void>;
  createLead: (leadData: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (leadId: string, status: string) => Promise<void>;
  assignLead: (leadId: string, userId: string) => Promise<void>;
  createSalesFunnel: (funnelData: Partial<SalesFunnel>) => Promise<void>;
  updateFunnelStage: (funnelId: string, leadId: string, stageId: string) => Promise<void>;
  createWorkspace: (workspaceData: Partial<TeamWorkspace>) => Promise<void>;
  inviteToWorkspace: (workspaceId: string, email: string, role: string) => Promise<void>;
  createWorkspaceChannel: (workspaceId: string, channelData: any) => Promise<void>;
  sendWorkspaceMessage: (channelId: string, message: string) => Promise<void>;
  createProject: (workspaceId: string, projectData: any) => Promise<void>;
  assignTask: (taskId: string, userId: string) => Promise<void>;
  generateLeadReport: (dateRange: any) => Promise<any>;
  exportWorkspaceData: (workspaceId: string) => Promise<void>;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  crmIntegrations: [],
  leads: [],
  salesFunnels: [],
  workspaces: [],
  currentWorkspace: null,

  setupCRMIntegration: async (platform, config) => {
    try {
      const response = await fetch('/api/enterprise/crm/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, config })
      });
      const integration = await response.json();
      set(state => ({ crmIntegrations: [...state.crmIntegrations, integration] }));
    } catch (error) {
      console.error('Failed to setup CRM integration:', error);
    }
  },

  syncCRMData: async (integrationId) => {
    try {
      await fetch(`/api/enterprise/crm/${integrationId}/sync`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to sync CRM data:', error);
    }
  },

  createLead: async (leadData) => {
    try {
      const response = await fetch('/api/enterprise/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      const lead = await response.json();
      set(state => ({ leads: [...state.leads, lead] }));
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  },

  updateLeadStatus: async (leadId, status) => {
    try {
      const response = await fetch(`/api/enterprise/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const updatedLead = await response.json();
      set(state => ({
        leads: state.leads.map(l => l.id === leadId ? updatedLead : l)
      }));
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  },

  assignLead: async (leadId, userId) => {
    try {
      await fetch(`/api/enterprise/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Failed to assign lead:', error);
    }
  },

  createSalesFunnel: async (funnelData) => {
    try {
      const response = await fetch('/api/enterprise/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(funnelData)
      });
      const funnel = await response.json();
      set(state => ({ salesFunnels: [...state.salesFunnels, funnel] }));
    } catch (error) {
      console.error('Failed to create sales funnel:', error);
    }
  },

  updateFunnelStage: async (funnelId, leadId, stageId) => {
    try {
      await fetch(`/api/enterprise/funnels/${funnelId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, stageId })
      });
    } catch (error) {
      console.error('Failed to update funnel stage:', error);
    }
  },

  createWorkspace: async (workspaceData) => {
    try {
      const response = await fetch('/api/enterprise/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceData)
      });
      const workspace = await response.json();
      set(state => ({ workspaces: [...state.workspaces, workspace] }));
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  },

  inviteToWorkspace: async (workspaceId, email, role) => {
    try {
      await fetch(`/api/enterprise/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
    } catch (error) {
      console.error('Failed to invite to workspace:', error);
    }
  },

  createWorkspaceChannel: async (workspaceId, channelData) => {
    try {
      const response = await fetch(`/api/enterprise/workspaces/${workspaceId}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData)
      });
      const channel = await response.json();
      set(state => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId 
            ? { ...w, channels: [...w.channels, channel] }
            : w
        )
      }));
    } catch (error) {
      console.error('Failed to create workspace channel:', error);
    }
  },

  sendWorkspaceMessage: async (channelId, message) => {
    try {
      const response = await fetch(`/api/enterprise/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const messageData = await response.json();
      // Update workspace channel with new message
    } catch (error) {
      console.error('Failed to send workspace message:', error);
    }
  },

  createProject: async (workspaceId, projectData) => {
    try {
      const response = await fetch(`/api/enterprise/workspaces/${workspaceId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      const project = await response.json();
      set(state => ({
        workspaces: state.workspaces.map(w => 
          w.id === workspaceId 
            ? { ...w, projects: [...w.projects, project] }
            : w
        )
      }));
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  },

  assignTask: async (taskId, userId) => {
    try {
      await fetch(`/api/enterprise/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  },

  generateLeadReport: async (dateRange) => {
    try {
      const response = await fetch('/api/enterprise/reports/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateRange)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to generate lead report:', error);
      return null;
    }
  },

  exportWorkspaceData: async (workspaceId) => {
    try {
      const response = await fetch(`/api/enterprise/workspaces/${workspaceId}/export`, {
        method: 'POST'
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace-${workspaceId}-export.zip`;
      a.click();
    } catch (error) {
      console.error('Failed to export workspace data:', error);
    }
  }
}));