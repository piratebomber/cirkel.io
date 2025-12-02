import { create } from 'zustand';
import { MiniGame, Achievement, Leaderboard, VirtualReward } from '@/types/web3';

interface GamingState {
  games: MiniGame[];
  achievements: Achievement[];
  leaderboards: Leaderboard[];
  rewards: VirtualReward[];
  currentGame: MiniGame | null;
  playerStats: any;
  inventory: VirtualReward[];
  
  // Actions
  createGame: (gameData: Partial<MiniGame>) => Promise<void>;
  startGame: (gameId: string) => Promise<void>;
  endGame: (gameId: string, score: number) => Promise<void>;
  joinMultiplayerGame: (gameId: string) => Promise<void>;
  leaveGame: () => void;
  unlockAchievement: (achievementId: string) => Promise<void>;
  createAchievement: (achievementData: Partial<Achievement>) => Promise<void>;
  updateLeaderboard: (leaderboardId: string, score: number) => Promise<void>;
  createLeaderboard: (leaderboardData: Partial<Leaderboard>) => Promise<void>;
  earnReward: (rewardId: string) => Promise<void>;
  tradeReward: (rewardId: string, recipientId: string) => Promise<void>;
  createReward: (rewardData: Partial<VirtualReward>) => Promise<void>;
  getPlayerStats: () => Promise<void>;
  createTournament: (gameId: string, tournamentData: any) => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<void>;
  getGameAnalytics: (gameId: string) => Promise<any>;
}

export const useGamingStore = create<GamingState>((set, get) => ({
  games: [],
  achievements: [],
  leaderboards: [],
  rewards: [],
  currentGame: null,
  playerStats: null,
  inventory: [],

  createGame: async (gameData) => {
    try {
      const response = await fetch('/api/gaming/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      const game = await response.json();
      set(state => ({ games: [...state.games, game] }));
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  },

  startGame: async (gameId) => {
    try {
      const response = await fetch(`/api/gaming/games/${gameId}/start`, {
        method: 'POST'
      });
      const game = await response.json();
      set({ currentGame: game });
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  },

  endGame: async (gameId, score) => {
    try {
      const response = await fetch(`/api/gaming/games/${gameId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      const result = await response.json();
      set({ currentGame: null });
      return result;
    } catch (error) {
      console.error('Failed to end game:', error);
    }
  },

  joinMultiplayerGame: async (gameId) => {
    try {
      const response = await fetch(`/api/gaming/games/${gameId}/join`, {
        method: 'POST'
      });
      const game = await response.json();
      set({ currentGame: game });
    } catch (error) {
      console.error('Failed to join multiplayer game:', error);
    }
  },

  leaveGame: () => {
    set({ currentGame: null });
  },

  unlockAchievement: async (achievementId) => {
    try {
      const response = await fetch(`/api/gaming/achievements/${achievementId}/unlock`, {
        method: 'POST'
      });
      const achievement = await response.json();
      set(state => ({
        achievements: state.achievements.map(a => 
          a.id === achievementId ? achievement : a
        )
      }));
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  },

  createAchievement: async (achievementData) => {
    try {
      const response = await fetch('/api/gaming/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(achievementData)
      });
      const achievement = await response.json();
      set(state => ({ achievements: [...state.achievements, achievement] }));
    } catch (error) {
      console.error('Failed to create achievement:', error);
    }
  },

  updateLeaderboard: async (leaderboardId, score) => {
    try {
      const response = await fetch(`/api/gaming/leaderboards/${leaderboardId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });
      const leaderboard = await response.json();
      set(state => ({
        leaderboards: state.leaderboards.map(l => 
          l.id === leaderboardId ? leaderboard : l
        )
      }));
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  },

  createLeaderboard: async (leaderboardData) => {
    try {
      const response = await fetch('/api/gaming/leaderboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderboardData)
      });
      const leaderboard = await response.json();
      set(state => ({ leaderboards: [...state.leaderboards, leaderboard] }));
    } catch (error) {
      console.error('Failed to create leaderboard:', error);
    }
  },

  earnReward: async (rewardId) => {
    try {
      const response = await fetch(`/api/gaming/rewards/${rewardId}/earn`, {
        method: 'POST'
      });
      const reward = await response.json();
      set(state => ({ inventory: [...state.inventory, reward] }));
    } catch (error) {
      console.error('Failed to earn reward:', error);
    }
  },

  tradeReward: async (rewardId, recipientId) => {
    try {
      await fetch(`/api/gaming/rewards/${rewardId}/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId })
      });
      set(state => ({
        inventory: state.inventory.filter(r => r.id !== rewardId)
      }));
    } catch (error) {
      console.error('Failed to trade reward:', error);
    }
  },

  createReward: async (rewardData) => {
    try {
      const response = await fetch('/api/gaming/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardData)
      });
      const reward = await response.json();
      set(state => ({ rewards: [...state.rewards, reward] }));
    } catch (error) {
      console.error('Failed to create reward:', error);
    }
  },

  getPlayerStats: async () => {
    try {
      const response = await fetch('/api/gaming/stats');
      const stats = await response.json();
      set({ playerStats: stats });
    } catch (error) {
      console.error('Failed to get player stats:', error);
    }
  },

  createTournament: async (gameId, tournamentData) => {
    try {
      const response = await fetch(`/api/gaming/games/${gameId}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  },

  joinTournament: async (tournamentId) => {
    try {
      await fetch(`/api/gaming/tournaments/${tournamentId}/join`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to join tournament:', error);
    }
  },

  getGameAnalytics: async (gameId) => {
    try {
      const response = await fetch(`/api/gaming/games/${gameId}/analytics`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get game analytics:', error);
      return null;
    }
  }
}));