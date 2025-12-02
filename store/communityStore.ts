import { create } from 'zustand'
import { Community, CommunityMember, Post } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface CommunityStore {
  communities: Community[]
  userCommunities: Community[]
  activeCommunity: Community | null
  communityPosts: Post[]
  members: CommunityMember[]
  isLoading: boolean
  
  // Actions
  fetchCommunities: () => Promise<void>
  fetchUserCommunities: (userId: string) => Promise<void>
  fetchCommunity: (communityId: string) => Promise<void>
  fetchCommunityPosts: (communityId: string) => Promise<void>
  fetchMembers: (communityId: string) => Promise<void>
  
  // Community management
  createCommunity: (data: Partial<Community>) => Promise<string>
  updateCommunity: (communityId: string, updates: Partial<Community>) => Promise<void>
  deleteCommunity: (communityId: string) => Promise<void>
  
  // Membership
  joinCommunity: (communityId: string, userId: string) => Promise<void>
  leaveCommunity: (communityId: string, userId: string) => Promise<void>
  updateMemberRole: (communityId: string, userId: string, role: string) => Promise<void>
  
  // Moderation
  addRule: (communityId: string, rule: any) => Promise<void>
  updateRule: (ruleId: string, updates: any) => Promise<void>
  deleteRule: (ruleId: string) => Promise<void>
  
  // Posts
  createCommunityPost: (communityId: string, postData: any) => Promise<void>
  moderatePost: (postId: string, action: string) => Promise<void>
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  communities: [],
  userCommunities: [],
  activeCommunity: null,
  communityPosts: [],
  members: [],
  isLoading: false,

  fetchCommunities: async () => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('communities')
        .select(`
          *,
          creator:users(*),
          member_count:community_members(count)
        `)
        .eq('is_private', false)
        .order('member_count', { ascending: false })

      set({ communities: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching communities:', error)
      set({ isLoading: false })
    }
  },

  fetchUserCommunities: async (userId: string) => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select(`
          community:communities(*)
        `)
        .eq('user_id', userId)

      set({ userCommunities: data?.map(item => item.community) || [] })
    } catch (error) {
      console.error('Error fetching user communities:', error)
    }
  },

  fetchCommunity: async (communityId: string) => {
    try {
      const { data } = await supabase
        .from('communities')
        .select(`
          *,
          creator:users(*),
          rules:community_rules(*),
          moderators:community_members!inner(
            user:users(*),
            role
          )
        `)
        .eq('id', communityId)
        .single()

      set({ activeCommunity: data })
    } catch (error) {
      console.error('Error fetching community:', error)
    }
  },

  fetchCommunityPosts: async (communityId: string) => {
    set({ isLoading: true })
    try {
      const { data } = await supabase
        .from('posts')
        .select(`
          *,
          author:users(*),
          likes:post_likes(count),
          reposts:post_reposts(count),
          comments:post_comments(count),
          media:post_media(*)
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })

      set({ communityPosts: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching community posts:', error)
      set({ isLoading: false })
    }
  },

  fetchMembers: async (communityId: string) => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select(`
          *,
          user:users(*)
        `)
        .eq('community_id', communityId)
        .order('joined_at', { ascending: false })

      set({ members: data || [] })
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  },

  createCommunity: async (data: Partial<Community>) => {
    try {
      const { data: community } = await supabase
        .from('communities')
        .insert({
          ...data,
          created_at: new Date().toISOString(),
          member_count: 1,
          post_count: 0
        })
        .select()
        .single()

      // Add creator as owner
      await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: data.creatorId,
          role: 'owner',
          joined_at: new Date().toISOString()
        })

      toast.success('Community created successfully!')
      return community.id
    } catch (error) {
      console.error('Error creating community:', error)
      toast.error('Failed to create community')
      throw error
    }
  },

  updateCommunity: async (communityId: string, updates: Partial<Community>) => {
    try {
      await supabase
        .from('communities')
        .update(updates)
        .eq('id', communityId)

      set(state => ({
        activeCommunity: state.activeCommunity?.id === communityId
          ? { ...state.activeCommunity, ...updates }
          : state.activeCommunity
      }))

      toast.success('Community updated successfully!')
    } catch (error) {
      console.error('Error updating community:', error)
      toast.error('Failed to update community')
    }
  },

  deleteCommunity: async (communityId: string) => {
    try {
      await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

      set(state => ({
        communities: state.communities.filter(c => c.id !== communityId),
        userCommunities: state.userCommunities.filter(c => c.id !== communityId),
        activeCommunity: state.activeCommunity?.id === communityId ? null : state.activeCommunity
      }))

      toast.success('Community deleted successfully!')
    } catch (error) {
      console.error('Error deleting community:', error)
      toast.error('Failed to delete community')
    }
  },

  joinCommunity: async (communityId: string, userId: string) => {
    try {
      await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        })

      // Update member count
      await supabase.rpc('increment_community_members', { community_id: communityId })

      toast.success('Joined community successfully!')
    } catch (error) {
      console.error('Error joining community:', error)
      toast.error('Failed to join community')
    }
  },

  leaveCommunity: async (communityId: string, userId: string) => {
    try {
      await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId)

      // Update member count
      await supabase.rpc('decrement_community_members', { community_id: communityId })

      toast.success('Left community successfully!')
    } catch (error) {
      console.error('Error leaving community:', error)
      toast.error('Failed to leave community')
    }
  },

  updateMemberRole: async (communityId: string, userId: string, role: string) => {
    try {
      await supabase
        .from('community_members')
        .update({ role })
        .eq('community_id', communityId)
        .eq('user_id', userId)

      set(state => ({
        members: state.members.map(m => 
          m.communityId === communityId && m.userId === userId
            ? { ...m, role }
            : m
        )
      }))

      toast.success('Member role updated!')
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error('Failed to update member role')
    }
  },

  addRule: async (communityId: string, rule: any) => {
    try {
      await supabase
        .from('community_rules')
        .insert({
          community_id: communityId,
          ...rule
        })

      toast.success('Rule added successfully!')
    } catch (error) {
      console.error('Error adding rule:', error)
      toast.error('Failed to add rule')
    }
  },

  updateRule: async (ruleId: string, updates: any) => {
    try {
      await supabase
        .from('community_rules')
        .update(updates)
        .eq('id', ruleId)

      toast.success('Rule updated successfully!')
    } catch (error) {
      console.error('Error updating rule:', error)
      toast.error('Failed to update rule')
    }
  },

  deleteRule: async (ruleId: string) => {
    try {
      await supabase
        .from('community_rules')
        .delete()
        .eq('id', ruleId)

      toast.success('Rule deleted successfully!')
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error('Failed to delete rule')
    }
  },

  createCommunityPost: async (communityId: string, postData: any) => {
    try {
      const { data } = await supabase
        .from('posts')
        .insert({
          ...postData,
          community_id: communityId,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          author:users(*),
          community:communities(*)
        `)
        .single()

      // Update community post count
      await supabase.rpc('increment_community_posts', { community_id: communityId })

      set(state => ({
        communityPosts: [data, ...state.communityPosts]
      }))

      toast.success('Post created in community!')
    } catch (error) {
      console.error('Error creating community post:', error)
      toast.error('Failed to create post')
    }
  },

  moderatePost: async (postId: string, action: string) => {
    try {
      await supabase
        .from('posts')
        .update({ moderation_status: action })
        .eq('id', postId)

      set(state => ({
        communityPosts: state.communityPosts.map(p =>
          p.id === postId ? { ...p, moderationStatus: action } : p
        )
      }))

      toast.success(`Post ${action} successfully!`)
    } catch (error) {
      console.error('Error moderating post:', error)
      toast.error('Failed to moderate post')
    }
  }
}))