import { create } from 'zustand';
import { AITranslation, AIContentGeneration, DeepfakeDetection, ViralPrediction } from '@/types/web3';

interface AIState {
  translations: AITranslation[];
  contentGenerations: AIContentGeneration[];
  deepfakeDetections: DeepfakeDetection[];
  viralPredictions: ViralPrediction[];
  isProcessing: boolean;
  
  // Actions
  translateContent: (text: string, targetLanguage: string, context?: string) => Promise<void>;
  generateContent: (type: string, prompt: string, parameters: any) => Promise<void>;
  detectDeepfake: (mediaUrl: string, mediaType: string) => Promise<void>;
  predictVirality: (postId: string) => Promise<void>;
  generateHashtags: (content: string) => Promise<string[]>;
  generateCaption: (imageUrl: string, style: string) => Promise<string>;
  analyzeSentiment: (text: string) => Promise<any>;
  moderateContent: (content: string, mediaUrls?: string[]) => Promise<any>;
  generateScript: (topic: string, duration: number, style: string) => Promise<string>;
  optimizeContent: (content: string, platform: string) => Promise<any>;
}

export const useAIStore = create<AIState>((set, get) => ({
  translations: [],
  contentGenerations: [],
  deepfakeDetections: [],
  viralPredictions: [],
  isProcessing: false,

  translateContent: async (text, targetLanguage, context) => {
    set({ isProcessing: true });
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage, context })
      });
      const translation = await response.json();
      set(state => ({
        translations: [...state.translations, translation],
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to translate content:', error);
      set({ isProcessing: false });
    }
  },

  generateContent: async (type, prompt, parameters) => {
    set({ isProcessing: true });
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, prompt, parameters })
      });
      const generation = await response.json();
      set(state => ({
        contentGenerations: [...state.contentGenerations, generation],
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to generate content:', error);
      set({ isProcessing: false });
    }
  },

  detectDeepfake: async (mediaUrl, mediaType) => {
    set({ isProcessing: true });
    try {
      const response = await fetch('/api/ai/deepfake-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl, mediaType })
      });
      const detection = await response.json();
      set(state => ({
        deepfakeDetections: [...state.deepfakeDetections, detection],
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to detect deepfake:', error);
      set({ isProcessing: false });
    }
  },

  predictVirality: async (postId) => {
    set({ isProcessing: true });
    try {
      const response = await fetch('/api/ai/viral-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId })
      });
      const prediction = await response.json();
      set(state => ({
        viralPredictions: [...state.viralPredictions, prediction],
        isProcessing: false
      }));
    } catch (error) {
      console.error('Failed to predict virality:', error);
      set({ isProcessing: false });
    }
  },

  generateHashtags: async (content) => {
    try {
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const { hashtags } = await response.json();
      return hashtags;
    } catch (error) {
      console.error('Failed to generate hashtags:', error);
      return [];
    }
  },

  generateCaption: async (imageUrl, style) => {
    try {
      const response = await fetch('/api/ai/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, style })
      });
      const { caption } = await response.json();
      return caption;
    } catch (error) {
      console.error('Failed to generate caption:', error);
      return '';
    }
  },

  analyzeSentiment: async (text) => {
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return null;
    }
  },

  moderateContent: async (content, mediaUrls) => {
    try {
      const response = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, mediaUrls })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to moderate content:', error);
      return null;
    }
  },

  generateScript: async (topic, duration, style) => {
    try {
      const response = await fetch('/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, duration, style })
      });
      const { script } = await response.json();
      return script;
    } catch (error) {
      console.error('Failed to generate script:', error);
      return '';
    }
  },

  optimizeContent: async (content, platform) => {
    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to optimize content:', error);
      return null;
    }
  }
}));