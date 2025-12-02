import { create } from 'zustand'
import { PostAnalytics, EngagementStats } from '@/types'
import { supabase } from '@/lib/supabase'

interface AnalyticsStore {
  userAnalytics: any
  postAnalytics: Record<string, PostAnalytics>
  engagementData: any[]
  followerGrowth: any[]
  topPosts: any[]
  audienceInsights: any
  isLoading: boolean
  
  // Actions
  fetchUserAnalytics: (userId: string, timeframe: string) => Promise<void>
  fetchPostAnalytics: (postId: string) => Promise<void>
  fetchEngagementData: (userId: string, timeframe: string) => Promise<void>
  fetchFollowerGrowth: (userId: string, timeframe: string) => Promise<void>
  fetchTopPosts: (userId: string, timeframe: string) => Promise<void>
  fetchAudienceInsights: (userId: string) => Promise<void>
  
  // Tracking
  trackPostView: (postId: string, userId?: string) => Promise<void>
  trackEngagement: (postId: string, type: string, userId?: string) => Promise<void>
  trackProfileView: (profileId: string, viewerId?: string) => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  userAnalytics: null,
  postAnalytics: {},
  engagementData: [],
  followerGrowth: [],
  topPosts: [],
  audienceInsights: null,
  isLoading: false,

  fetchUserAnalytics: async (userId: string, timeframe: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase.rpc('get_user_analytics', {
        user_id: userId,
        timeframe
      })

      set({ userAnalytics: data, isLoading: false })
    } catch (error) {
      console.error('Error fetching user analytics:', error)
      set({ isLoading: false })
    }
  },

  fetchPostAnalytics: async (postId: string) => {
    try {
      const { data } = await supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', postId)
        .single()

      if (data) {
        set(state => ({
          postAnalytics: {
            ...state.postAnalytics,
            [postId]: data
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching post analytics:', error)
    }
  },

  fetchEngagementData: async (userId: string, timeframe: string) => {
    try {
      const { data } = await supabase.rpc('get_engagement_data', {
        user_id: userId,
        timeframe
      })

      set({ engagementData: data || [] })
    } catch (error) {
      console.error('Error fetching engagement data:', error)
    }
  },

  fetchFollowerGrowth: async (userId: string, timeframe: string) => {
    try {
      const { data } = await supabase.rpc('get_follower_growth', {
        user_id: userId,
        timeframe
      })

      set({ followerGrowth: data || [] })
    } catch (error) {
      console.error('Error fetching follower growth:', error)
    }
  },

  fetchTopPosts: async (userId: string, timeframe: string) => {
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          likes:post_likes(count),
          reposts:post_reposts(count),
          comments:post_comments(count),
          analytics:post_analytics(*)
        `)
        .eq('author_id', userId)
        .gte('created_at', getTimeframeDate(timeframe))
        .order('views', { ascending: false })
        .limit(10)

      set({ topPosts: data || [] })
    } catch (error) {
      console.error('Error fetching top posts:', error)
    }
  },

  fetchAudienceInsights: async (userId: string) => {
    try {
      const { data } = await supabase.rpc('get_audience_insights', {
        user_id: userId
      })

      set({ audienceInsights: data })
    } catch (error) {
      console.error('Error fetching audience insights:', error)
    }
  },

  trackPostView: async (postId: string, userId?: string) => {
    try {
      // Increment view count
      await supabase.rpc('increment_post_views', { post_id: postId })

      // Track detailed view if user is logged in
      if (userId) {
        await supabase
          .from('post_views')
          .insert({
            post_id: postId,
            user_id: userId,
            viewed_at: new Date().toISOString(),
            device_type: getDeviceType(),
            referrer: document.referrer || 'direct'
          })
      }

      // Update hourly analytics
      const hour = new Date().getHours()
      await supabase.rpc('update_hourly_analytics', {
        post_id: postId,
        hour_index: hour
      })
    } catch (error) {
      console.error('Error tracking post view:', error)
    }
  },

  trackEngagement: async (postId: string, type: string, userId?: string) => {
    try {
      await supabase
        .from('engagement_events')
        .insert({
          post_id: postId,
          user_id: userId,
          event_type: type,
          created_at: new Date().toISOString()
        })

      // Update engagement rate
      await supabase.rpc('update_engagement_rate', { post_id: postId })
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  },

  trackProfileView: async (profileId: string, viewerId?: string) => {
    try {
      if (viewerId && viewerId !== profileId) {
        await supabase
          .from('profile_views')
          .insert({
            profile_id: profileId,
            viewer_id: viewerId,
            viewed_at: new Date().toISOString()
          })
      }
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }
}))

function getTimeframeDate(timeframe: string): string {
  const now = new Date()
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return new Date(0).toISOString()
  }
}

function getDeviceType(): string {
  const userAgent = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
  return 'desktop'
}