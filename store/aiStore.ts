import { create } from 'zustand'
import { Post, User } from '@/types'
import { supabase } from '@/lib/supabase'

interface AIStore {
  recommendations: Post[]
  suggestedHashtags: string[]
  suggestedUsers: User[]
  contentAnalysis: any
  translations: Record<string, string>
  smartReplies: string[]
  
  // Actions
  getContentRecommendations: (userId: string) => Promise<void>
  analyzeSentiment: (text: string) => Promise<any>
  generateHashtags: (content: string) => Promise<string[]>
  translateContent: (text: string, targetLang: string) => Promise<string>
  moderateContent: (content: string) => Promise<boolean>
  generateSmartReplies: (postContent: string) => Promise<string[]>
  suggestUsers: (userId: string) => Promise<void>
  detectLanguage: (text: string) => Promise<string>
  generateSummary: (text: string) => Promise<string>
}

export const useAIStore = create<AIStore>((set, get) => ({
  recommendations: [],
  suggestedHashtags: [],
  suggestedUsers: [],
  contentAnalysis: null,
  translations: {},
  smartReplies: [],

  getContentRecommendations: async (userId: string) => {
    try {
      const { data } = await supabase.rpc('get_ai_recommendations', {
        user_id: userId,
        limit: 20
      })
      set({ recommendations: data || [] })
    } catch (error) {
      console.error('AI recommendations error:', error)
    }
  },

  analyzeSentiment: async (text: string) => {
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const analysis = await response.json()
      set({ contentAnalysis: analysis })
      return analysis
    } catch (error) {
      console.error('Sentiment analysis error:', error)
      return { sentiment: 'neutral', confidence: 0 }
    }
  },

  generateHashtags: async (content: string) => {
    try {
      const response = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const { hashtags } = await response.json()
      set({ suggestedHashtags: hashtags })
      return hashtags
    } catch (error) {
      console.error('Hashtag generation error:', error)
      return []
    }
  },

  translateContent: async (text: string, targetLang: string) => {
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      })
      const { translation } = await response.json()
      set(state => ({
        translations: { ...state.translations, [text]: translation }
      }))
      return translation
    } catch (error) {
      console.error('Translation error:', error)
      return text
    }
  },

  moderateContent: async (content: string) => {
    try {
      const response = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      const { isAllowed, reasons } = await response.json()
      return isAllowed
    } catch (error) {
      console.error('Content moderation error:', error)
      return true
    }
  },

  generateSmartReplies: async (postContent: string) => {
    try {
      const response = await fetch('/api/ai/smart-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent })
      })
      const { replies } = await response.json()
      set({ smartReplies: replies })
      return replies
    } catch (error) {
      console.error('Smart replies error:', error)
      return []
    }
  },

  suggestUsers: async (userId: string) => {
    try {
      const { data } = await supabase.rpc('get_user_suggestions', {
        user_id: userId,
        limit: 10
      })
      set({ suggestedUsers: data || [] })
    } catch (error) {
      console.error('User suggestions error:', error)
    }
  },

  detectLanguage: async (text: string) => {
    try {
      const response = await fetch('/api/ai/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const { language } = await response.json()
      return language
    } catch (error) {
      console.error('Language detection error:', error)
      return 'en'
    }
  },

  generateSummary: async (text: string) => {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      const { summary } = await response.json()
      return summary
    } catch (error) {
      console.error('Summarization error:', error)
      return text.substring(0, 100) + '...'
    }
  }
}))