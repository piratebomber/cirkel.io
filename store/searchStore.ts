import { create } from 'zustand'
import { SearchResult, User, Post, Community, Hashtag } from '@/types'
import { supabase } from '@/lib/supabase'
import { debounce } from '@/lib/utils'

interface SearchStore {
  query: string
  results: SearchResult[]
  suggestions: string[]
  recentSearches: string[]
  savedSearches: string[]
  isLoading: boolean
  filters: {
    type: 'all' | 'users' | 'posts' | 'communities' | 'hashtags'
    dateRange: 'all' | 'day' | 'week' | 'month' | 'year'
    sortBy: 'relevance' | 'recent' | 'popular'
  }
  
  // Actions
  search: (query: string) => Promise<void>
  setQuery: (query: string) => void
  setFilters: (filters: Partial<SearchStore['filters']>) => void
  getSuggestions: (query: string) => Promise<void>
  saveSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  
  // Advanced search
  searchUsers: (query: string, filters?: any) => Promise<User[]>
  searchPosts: (query: string, filters?: any) => Promise<Post[]>
  searchCommunities: (query: string, filters?: any) => Promise<Community[]>
  searchHashtags: (query: string) => Promise<Hashtag[]>
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  query: '',
  results: [],
  suggestions: [],
  recentSearches: JSON.parse(localStorage.getItem('cirkel-recent-searches') || '[]'),
  savedSearches: JSON.parse(localStorage.getItem('cirkel-saved-searches') || '[]'),
  isLoading: false,
  filters: {
    type: 'all',
    dateRange: 'all',
    sortBy: 'relevance'
  },

  search: debounce(async (query: string) => {
    if (!query.trim()) {
      set({ results: [] })
      return
    }

    set({ isLoading: true, query })
    
    try {
      const { filters } = get()
      const results: SearchResult[] = []

      // Search based on filters
      if (filters.type === 'all' || filters.type === 'users') {
        const users = await get().searchUsers(query)
        results.push(...users.map(user => ({
          type: 'user' as const,
          id: user.id,
          title: user.displayName,
          description: `@${user.username} • ${user.bio || ''}`,
          avatar: user.profilePicture,
          url: `/profile/${user.username}`,
          relevanceScore: calculateRelevance(query, user.displayName + ' ' + user.username),
          metadata: { verified: user.isVerified, followers: user.followerCount }
        })))
      }

      if (filters.type === 'all' || filters.type === 'posts') {
        const posts = await get().searchPosts(query)
        results.push(...posts.map(post => ({
          type: 'post' as const,
          id: post.id,
          title: post.content.substring(0, 100),
          description: `by @${post.author.username} • ${post.likes.length} likes`,
          avatar: post.author.profilePicture,
          url: `/post/${post.id}`,
          relevanceScore: calculateRelevance(query, post.content),
          metadata: { 
            likes: post.likes.length, 
            reposts: post.reposts.length,
            createdAt: post.createdAt
          }
        })))
      }

      if (filters.type === 'all' || filters.type === 'communities') {
        const communities = await get().searchCommunities(query)
        results.push(...communities.map(community => ({
          type: 'community' as const,
          id: community.id,
          title: community.displayName,
          description: `${community.memberCount} members • ${community.description}`,
          avatar: community.avatar,
          url: `/community/${community.name}`,
          relevanceScore: calculateRelevance(query, community.displayName + ' ' + community.description),
          metadata: { members: community.memberCount, posts: community.postCount }
        })))
      }

      if (filters.type === 'all' || filters.type === 'hashtags') {
        const hashtags = await get().searchHashtags(query)
        results.push(...hashtags.map(hashtag => ({
          type: 'hashtag' as const,
          id: hashtag.id,
          title: `#${hashtag.name}`,
          description: `${hashtag.postCount} posts`,
          url: `/hashtag/${hashtag.name}`,
          relevanceScore: calculateRelevance(query, hashtag.name),
          metadata: { posts: hashtag.postCount, trending: hashtag.trendingScore > 0 }
        })))
      }

      // Sort by relevance or other criteria
      results.sort((a, b) => {
        if (filters.sortBy === 'relevance') {
          return b.relevanceScore - a.relevanceScore
        } else if (filters.sortBy === 'recent') {
          return new Date(b.metadata?.createdAt || 0).getTime() - new Date(a.metadata?.createdAt || 0).getTime()
        } else if (filters.sortBy === 'popular') {
          return (b.metadata?.likes || b.metadata?.members || 0) - (a.metadata?.likes || a.metadata?.members || 0)
        }
        return 0
      })

      set({ results, isLoading: false })
      
      // Add to recent searches
      get().saveSearch(query)
    } catch (error) {
      console.error('Search error:', error)
      set({ isLoading: false })
    }
  }, 300),

  setQuery: (query: string) => {
    set({ query })
    if (query.trim()) {
      get().search(query)
      get().getSuggestions(query)
    } else {
      set({ results: [], suggestions: [] })
    }
  },

  setFilters: (newFilters: Partial<SearchStore['filters']>) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
    
    // Re-search with new filters
    const { query } = get()
    if (query.trim()) {
      get().search(query)
    }
  },

  getSuggestions: debounce(async (query: string) => {
    if (query.length < 2) {
      set({ suggestions: [] })
      return
    }

    try {
      // Get trending hashtags and popular searches
      const { data: hashtags } = await supabase
        .from('hashtags')
        .select('name')
        .ilike('name', `%${query}%`)
        .order('trending_score', { ascending: false })
        .limit(5)

      const { data: users } = await supabase
        .from('users')
        .select('username, display_name')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5)

      const suggestions = [
        ...hashtags?.map(h => `#${h.name}`) || [],
        ...users?.map(u => `@${u.username}`) || []
      ]

      set({ suggestions })
    } catch (error) {
      console.error('Error getting suggestions:', error)
    }
  }, 200),

  saveSearch: (query: string) => {
    const { recentSearches } = get()
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10)
    
    set({ recentSearches: updated })
    localStorage.setItem('cirkel-recent-searches', JSON.stringify(updated))
  },

  removeRecentSearch: (query: string) => {
    const { recentSearches } = get()
    const updated = recentSearches.filter(s => s !== query)
    
    set({ recentSearches: updated })
    localStorage.setItem('cirkel-recent-searches', JSON.stringify(updated))
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] })
    localStorage.removeItem('cirkel-recent-searches')
  },

  searchUsers: async (query: string, filters = {}) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%,bio.ilike.%${query}%`)
      .order('follower_count', { ascending: false })
      .limit(20)

    return data || []
  },

  searchPosts: async (query: string, filters = {}) => {
    let queryBuilder = supabase
      .from('posts')
      .select(`
        *,
        author:users(*),
        likes:post_likes(count),
        reposts:post_reposts(count),
        comments:post_comments(count)
      `)
      .textSearch('content', query)

    // Apply date filters
    const { dateRange } = get().filters
    if (dateRange !== 'all') {
      const now = new Date()
      let startDate = new Date()
      
      switch (dateRange) {
        case 'day':
          startDate.setDate(now.getDate() - 1)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      queryBuilder = queryBuilder.gte('created_at', startDate.toISOString())
    }

    const { data } = await queryBuilder
      .order('created_at', { ascending: false })
      .limit(20)

    return data || []
  },

  searchCommunities: async (query: string, filters = {}) => {
    const { data } = await supabase
      .from('communities')
      .select('*')
      .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('member_count', { ascending: false })
      .limit(20)

    return data || []
  },

  searchHashtags: async (query: string) => {
    const cleanQuery = query.replace('#', '')
    const { data } = await supabase
      .from('hashtags')
      .select('*')
      .ilike('name', `%${cleanQuery}%`)
      .order('trending_score', { ascending: false })
      .limit(20)

    return data || []
  }
}))

function calculateRelevance(query: string, text: string): number {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  
  // Exact match gets highest score
  if (textLower === queryLower) return 100
  
  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 80
  
  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 60
  
  // Word boundary matches get lower score
  const words = queryLower.split(' ')
  let score = 0
  words.forEach(word => {
    if (textLower.includes(word)) score += 20
  })
  
  return Math.min(score, 50)
}