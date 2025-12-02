import { create } from 'zustand';
import { ARFilter, ARExperience, Avatar3D } from '@/types/web3';

interface ARState {
  filters: ARFilter[];
  experiences: ARExperience[];
  avatars: Avatar3D[];
  currentFilter: ARFilter | null;
  currentExperience: ARExperience | null;
  currentAvatar: Avatar3D | null;
  isARActive: boolean;
  
  // Actions
  createFilter: (filterData: Partial<ARFilter>) => Promise<void>;
  applyFilter: (filterId: string) => Promise<void>;
  removeFilter: () => void;
  createExperience: (experienceData: Partial<ARExperience>) => Promise<void>;
  startExperience: (experienceId: string) => Promise<void>;
  endExperience: () => void;
  createAvatar: (avatarData: Partial<Avatar3D>) => Promise<void>;
  customizeAvatar: (avatarId: string, customizations: any) => Promise<void>;
  addAvatarAccessory: (avatarId: string, accessoryId: string) => Promise<void>;
  shareFilter: (filterId: string) => Promise<void>;
  publishExperience: (experienceId: string) => Promise<void>;
  trackARAnalytics: (type: string, data: any) => Promise<void>;
}

export const useARStore = create<ARState>((set, get) => ({
  filters: [],
  experiences: [],
  avatars: [],
  currentFilter: null,
  currentExperience: null,
  currentAvatar: null,
  isARActive: false,

  createFilter: async (filterData) => {
    try {
      const response = await fetch('/api/ar/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterData)
      });
      const filter = await response.json();
      set(state => ({ filters: [...state.filters, filter] }));
    } catch (error) {
      console.error('Failed to create filter:', error);
    }
  },

  applyFilter: async (filterId) => {
    try {
      const response = await fetch(`/api/ar/filters/${filterId}/apply`, {
        method: 'POST'
      });
      const filter = await response.json();
      set({ currentFilter: filter, isARActive: true });
    } catch (error) {
      console.error('Failed to apply filter:', error);
    }
  },

  removeFilter: () => {
    set({ currentFilter: null, isARActive: false });
  },

  createExperience: async (experienceData) => {
    try {
      const response = await fetch('/api/ar/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experienceData)
      });
      const experience = await response.json();
      set(state => ({ experiences: [...state.experiences, experience] }));
    } catch (error) {
      console.error('Failed to create experience:', error);
    }
  },

  startExperience: async (experienceId) => {
    try {
      const response = await fetch(`/api/ar/experiences/${experienceId}/start`, {
        method: 'POST'
      });
      const experience = await response.json();
      set({ currentExperience: experience, isARActive: true });
    } catch (error) {
      console.error('Failed to start experience:', error);
    }
  },

  endExperience: () => {
    set({ currentExperience: null, isARActive: false });
  },

  createAvatar: async (avatarData) => {
    try {
      const response = await fetch('/api/ar/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avatarData)
      });
      const avatar = await response.json();
      set(state => ({ avatars: [...state.avatars, avatar] }));
    } catch (error) {
      console.error('Failed to create avatar:', error);
    }
  },

  customizeAvatar: async (avatarId, customizations) => {
    try {
      const response = await fetch(`/api/ar/avatars/${avatarId}/customize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customizations)
      });
      const avatar = await response.json();
      set(state => ({
        avatars: state.avatars.map(a => a.id === avatarId ? avatar : a),
        currentAvatar: state.currentAvatar?.id === avatarId ? avatar : state.currentAvatar
      }));
    } catch (error) {
      console.error('Failed to customize avatar:', error);
    }
  },

  addAvatarAccessory: async (avatarId, accessoryId) => {
    try {
      await fetch(`/api/ar/avatars/${avatarId}/accessories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessoryId })
      });
    } catch (error) {
      console.error('Failed to add avatar accessory:', error);
    }
  },

  shareFilter: async (filterId) => {
    try {
      await fetch(`/api/ar/filters/${filterId}/share`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to share filter:', error);
    }
  },

  publishExperience: async (experienceId) => {
    try {
      await fetch(`/api/ar/experiences/${experienceId}/publish`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to publish experience:', error);
    }
  },

  trackARAnalytics: async (type, data) => {
    try {
      await fetch('/api/ar/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
    } catch (error) {
      console.error('Failed to track AR analytics:', error);
    }
  }
}));