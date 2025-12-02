import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

interface PersonalizationStore {
  userPreferences: any
  feedAlgorithm: any
  interests: string[]
  behaviorData: any
  abTests: any[]
  recommendations: any[]
  
  // Actions
  updatePreferences: (preferences: any) => Promise<void>
  addInterest: (interest: string) => Promise<void>
  removeInterest: (interest: string) => Promise<void>
  trackBehavior: (action: string, data: any) => Promise<void>
  getPersonalizedFeed: (userId: string) => Promise<any[]>
  getRecommendations: (type: string) => Promise<any[]>
  
  // A/B Testing
  getActiveTests: () => Promise<void>
  trackTestEvent: (testId: string, event: string) => Promise<void>
  
  // ML Features
  updateUserEmbedding: (interactions: any[]) => Promise<void>
  getSimilarUsers: (userId: string) => Promise<any[]>
  predictEngagement: (postId: string) => Promise<number>
}

export const usePersonalizationStore = create<PersonalizationStore>()(
  persist(
    (set, get) => ({
      userPreferences: {
        feedType: 'algorithmic',
        contentTypes: ['text', 'image', 'video'],
        languages: ['en'],
        topics: [],
        timePreference: 'recent',
        engagementWeight: 0.7,
        diversityWeight: 0.3
      },
      feedAlgorithm: {
        recencyWeight: 0.3,
        engagementWeight: 0.4,
        relevanceWeight: 0.2,
        diversityWeight: 0.1
      },
      interests: [],
      behaviorData: {
        viewTime: {},
        interactions: {},
        scrollDepth: {},
        clickPatterns: {}
      },
      abTests: [],
      recommendations: [],

      updatePreferences: async (preferences: any) => {
        try {
          await supabase
            .from('user_preferences')
            .upsert({
              ...preferences,
              updated_at: new Date().toISOString()
            })

          set({ userPreferences: preferences })
        } catch (error) {
          console.error('Update preferences error:', error)
        }
      },

      addInterest: async (interest: string) => {
        try {
          const { interests } = get()
          const newInterests = [...interests, interest]

          await supabase
            .from('user_interests')
            .insert({
              interest,
              weight: 1.0,
              created_at: new Date().toISOString()
            })

          set({ interests: newInterests })
        } catch (error) {
          console.error('Add interest error:', error)
        }
      },

      removeInterest: async (interest: string) => {
        try {
          await supabase
            .from('user_interests')
            .delete()
            .eq('interest', interest)

          set(state => ({
            interests: state.interests.filter(i => i !== interest)
          }))
        } catch (error) {
          console.error('Remove interest error:', error)
        }
      },

      trackBehavior: async (action: string, data: any) => {
        try {
          await supabase
            .from('user_behavior')
            .insert({
              action,
              data,
              timestamp: new Date().toISOString()
            })

          // Update local behavior data
          set(state => ({
            behaviorData: {
              ...state.behaviorData,
              [action]: {
                ...state.behaviorData[action],
                ...data
              }
            }
          }))
        } catch (error) {
          console.error('Track behavior error:', error)
        }
      },

      getPersonalizedFeed: async (userId: string) => {
        try {
          const { data } = await supabase.rpc('get_personalized_feed', {
            user_id: userId,
            algorithm_weights: get().feedAlgorithm,
            user_preferences: get().userPreferences
          })

          return data || []
        } catch (error) {
          console.error('Personalized feed error:', error)
          return []
        }
      },

      getRecommendations: async (type: string) => {
        try {
          const { data } = await supabase.rpc('get_recommendations', {
            recommendation_type: type,
            user_interests: get().interests,
            behavior_data: get().behaviorData
          })

          set({ recommendations: data || [] })
          return data || []
        } catch (error) {
          console.error('Recommendations error:', error)
          return []
        }
      },

      getActiveTests: async () => {
        try {
          const { data } = await supabase
            .from('ab_tests')
            .select('*')
            .eq('status', 'active')

          set({ abTests: data || [] })
        } catch (error) {
          console.error('Get A/B tests error:', error)
        }
      },

      trackTestEvent: async (testId: string, event: string) => {
        try {
          await supabase
            .from('ab_test_events')
            .insert({
              test_id: testId,
              event,
              timestamp: new Date().toISOString()
            })
        } catch (error) {
          console.error('Track test event error:', error)
        }
      },

      updateUserEmbedding: async (interactions: any[]) => {
        try {
          const response = await fetch('/api/ml/update-embedding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interactions })
          })

          if (response.ok) {
            const { embedding } = await response.json()
            
            await supabase
              .from('user_embeddings')
              .upsert({
                embedding,
                updated_at: new Date().toISOString()
              })
          }
        } catch (error) {
          console.error('Update embedding error:', error)
        }
      },

      getSimilarUsers: async (userId: string) => {
        try {
          const { data } = await supabase.rpc('get_similar_users', {
            user_id: userId,
            limit: 10
          })

          return data || []
        } catch (error) {
          console.error('Similar users error:', error)
          return []
        }
      },

      predictEngagement: async (postId: string) => {
        try {
          const response = await fetch('/api/ml/predict-engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              postId,
              userPreferences: get().userPreferences,
              behaviorData: get().behaviorData
            })
          })

          const { engagementScore } = await response.json()
          return engagementScore || 0
        } catch (error) {
          console.error('Predict engagement error:', error)
          return 0
        }
      }
    }),
    { name: 'cirkel-personalization' }
  )
)

// Behavior tracking helpers
export const trackViewTime = (postId: string, duration: number) => {
  const store = usePersonalizationStore.getState()
  store.trackBehavior('view_time', { postId, duration })
}

export const trackInteraction = (type: string, targetId: string) => {
  const store = usePersonalizationStore.getState()
  store.trackBehavior('interaction', { type, targetId, timestamp: Date.now() })
}

export const trackScrollDepth = (postId: string, depth: number) => {
  const store = usePersonalizationStore.getState()
  store.trackBehavior('scroll_depth', { postId, depth })
}

// A/B Testing helpers
export const getTestVariant = (testName: string) => {
  const { abTests } = usePersonalizationStore.getState()
  const test = abTests.find(t => t.name === testName)
  
  if (!test) return 'control'
  
  // Simple hash-based assignment
  const hash = hashString(testName + localStorage.getItem('userId'))
  return hash % 2 === 0 ? 'control' : 'variant'
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}