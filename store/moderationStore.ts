import { create } from 'zustand'
import { ModerationAction, Report } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface ModerationStore {
  reports: Report[]
  moderationActions: ModerationAction[]
  bannedUsers: any[]
  contentFilters: any[]
  autoModerationRules: any[]
  isLoading: boolean
  
  // Actions
  fetchReports: (status?: string) => Promise<void>
  fetchModerationActions: (targetId?: string) => Promise<void>
  fetchBannedUsers: () => Promise<void>
  
  // Reporting
  createReport: (report: Partial<Report>) => Promise<void>
  updateReportStatus: (reportId: string, status: string, resolution?: string) => Promise<void>
  assignReport: (reportId: string, moderatorId: string) => Promise<void>
  
  // Moderation actions
  warnUser: (userId: string, reason: string) => Promise<void>
  muteUser: (userId: string, duration: number, reason: string) => Promise<void>
  suspendUser: (userId: string, duration: number, reason: string) => Promise<void>
  banUser: (userId: string, reason: string) => Promise<void>
  unbanUser: (userId: string) => Promise<void>
  
  // Content moderation
  deletePost: (postId: string, reason: string) => Promise<void>
  hidePost: (postId: string, reason: string) => Promise<void>
  flagContent: (contentId: string, contentType: string, reason: string) => Promise<void>
  
  // Auto-moderation
  createAutoModerationRule: (rule: any) => Promise<void>
  updateAutoModerationRule: (ruleId: string, updates: any) => Promise<void>
  deleteAutoModerationRule: (ruleId: string) => Promise<void>
  
  // Content filtering
  addContentFilter: (filter: any) => Promise<void>
  removeContentFilter: (filterId: string) => Promise<void>
  checkContent: (content: string) => Promise<boolean>
}

export const useModerationStore = create<ModerationStore>((set, get) => ({
  reports: [],
  moderationActions: [],
  bannedUsers: [],
  contentFilters: [],
  autoModerationRules: [],
  isLoading: false,

  fetchReports: async (status?: string) => {
    set({ isLoading: true })
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:users!reporter_id(*),
          assigned_moderator:users!assigned_to(*)
        `)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data } = await query
      set({ reports: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching reports:', error)
      set({ isLoading: false })
    }
  },

  fetchModerationActions: async (targetId?: string) => {
    try {
      let query = supabase
        .from('moderation_actions')
        .select(`
          *,
          moderator:users!moderator_id(*)
        `)
        .order('created_at', { ascending: false })

      if (targetId) {
        query = query.eq('target_id', targetId)
      }

      const { data } = await query
      set({ moderationActions: data || [] })
    } catch (error) {
      console.error('Error fetching moderation actions:', error)
    }
  },

  fetchBannedUsers: async () => {
    try {
      const { data } = await supabase
        .from('moderation_actions')
        .select(`
          *,
          user:users!target_id(*),
          moderator:users!moderator_id(*)
        `)
        .eq('type', 'ban')
        .eq('is_active', true)

      set({ bannedUsers: data || [] })
    } catch (error) {
      console.error('Error fetching banned users:', error)
    }
  },

  createReport: async (report: Partial<Report>) => {
    try {
      const { data } = await supabase
        .from('reports')
        .insert({
          ...report,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          reporter:users!reporter_id(*)
        `)
        .single()

      set(state => ({
        reports: [data, ...state.reports]
      }))

      toast.success('Report submitted successfully')
    } catch (error) {
      console.error('Error creating report:', error)
      toast.error('Failed to submit report')
    }
  },

  updateReportStatus: async (reportId: string, status: string, resolution?: string) => {
    try {
      await supabase
        .from('reports')
        .update({
          status,
          resolution,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', reportId)

      set(state => ({
        reports: state.reports.map(r =>
          r.id === reportId ? { ...r, status, resolution } : r
        )
      }))

      toast.success('Report status updated')
    } catch (error) {
      console.error('Error updating report status:', error)
      toast.error('Failed to update report')
    }
  },

  assignReport: async (reportId: string, moderatorId: string) => {
    try {
      await supabase
        .from('reports')
        .update({
          assigned_to: moderatorId,
          status: 'reviewing'
        })
        .eq('id', reportId)

      toast.success('Report assigned successfully')
    } catch (error) {
      console.error('Error assigning report:', error)
      toast.error('Failed to assign report')
    }
  },

  warnUser: async (userId: string, reason: string) => {
    try {
      await supabase
        .from('moderation_actions')
        .insert({
          type: 'warn',
          target_type: 'user',
          target_id: userId,
          reason,
          is_active: true,
          created_at: new Date().toISOString()
        })

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'moderation_action',
          title: 'Warning Issued',
          message: `You have received a warning: ${reason}`,
          created_at: new Date().toISOString()
        })

      toast.success('User warned successfully')
    } catch (error) {
      console.error('Error warning user:', error)
      toast.error('Failed to warn user')
    }
  },

  muteUser: async (userId: string, duration: number, reason: string) => {
    try {
      const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000)

      await supabase
        .from('moderation_actions')
        .insert({
          type: 'mute',
          target_type: 'user',
          target_id: userId,
          reason,
          duration,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success(`User muted for ${duration} hours`)
    } catch (error) {
      console.error('Error muting user:', error)
      toast.error('Failed to mute user')
    }
  },

  suspendUser: async (userId: string, duration: number, reason: string) => {
    try {
      const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000)

      await supabase
        .from('moderation_actions')
        .insert({
          type: 'suspend',
          target_type: 'user',
          target_id: userId,
          reason,
          duration,
          expires_at: expiresAt.toISOString(),
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success(`User suspended for ${duration} days`)
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    }
  },

  banUser: async (userId: string, reason: string) => {
    try {
      await supabase
        .from('moderation_actions')
        .insert({
          type: 'ban',
          target_type: 'user',
          target_id: userId,
          reason,
          is_active: true,
          created_at: new Date().toISOString()
        })

      // Deactivate user account
      await supabase
        .from('users')
        .update({ is_banned: true })
        .eq('id', userId)

      toast.success('User banned successfully')
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('Failed to ban user')
    }
  },

  unbanUser: async (userId: string) => {
    try {
      // Deactivate ban action
      await supabase
        .from('moderation_actions')
        .update({ is_active: false })
        .eq('target_id', userId)
        .eq('type', 'ban')

      // Reactivate user account
      await supabase
        .from('users')
        .update({ is_banned: false })
        .eq('id', userId)

      toast.success('User unbanned successfully')
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast.error('Failed to unban user')
    }
  },

  deletePost: async (postId: string, reason: string) => {
    try {
      await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId)

      await supabase
        .from('moderation_actions')
        .insert({
          type: 'delete_post',
          target_type: 'post',
          target_id: postId,
          reason,
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  },

  hidePost: async (postId: string, reason: string) => {
    try {
      await supabase
        .from('posts')
        .update({ is_hidden: true })
        .eq('id', postId)

      await supabase
        .from('moderation_actions')
        .insert({
          type: 'hide_post',
          target_type: 'post',
          target_id: postId,
          reason,
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success('Post hidden successfully')
    } catch (error) {
      console.error('Error hiding post:', error)
      toast.error('Failed to hide post')
    }
  },

  flagContent: async (contentId: string, contentType: string, reason: string) => {
    try {
      await supabase
        .from('content_flags')
        .insert({
          content_id: contentId,
          content_type: contentType,
          reason,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      toast.success('Content flagged for review')
    } catch (error) {
      console.error('Error flagging content:', error)
      toast.error('Failed to flag content')
    }
  },

  createAutoModerationRule: async (rule: any) => {
    try {
      await supabase
        .from('auto_moderation_rules')
        .insert({
          ...rule,
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success('Auto-moderation rule created')
    } catch (error) {
      console.error('Error creating auto-moderation rule:', error)
      toast.error('Failed to create rule')
    }
  },

  updateAutoModerationRule: async (ruleId: string, updates: any) => {
    try {
      await supabase
        .from('auto_moderation_rules')
        .update(updates)
        .eq('id', ruleId)

      toast.success('Auto-moderation rule updated')
    } catch (error) {
      console.error('Error updating auto-moderation rule:', error)
      toast.error('Failed to update rule')
    }
  },

  deleteAutoModerationRule: async (ruleId: string) => {
    try {
      await supabase
        .from('auto_moderation_rules')
        .delete()
        .eq('id', ruleId)

      toast.success('Auto-moderation rule deleted')
    } catch (error) {
      console.error('Error deleting auto-moderation rule:', error)
      toast.error('Failed to delete rule')
    }
  },

  addContentFilter: async (filter: any) => {
    try {
      await supabase
        .from('content_filters')
        .insert({
          ...filter,
          is_active: true,
          created_at: new Date().toISOString()
        })

      toast.success('Content filter added')
    } catch (error) {
      console.error('Error adding content filter:', error)
      toast.error('Failed to add filter')
    }
  },

  removeContentFilter: async (filterId: string) => {
    try {
      await supabase
        .from('content_filters')
        .delete()
        .eq('id', filterId)

      toast.success('Content filter removed')
    } catch (error) {
      console.error('Error removing content filter:', error)
      toast.error('Failed to remove filter')
    }
  },

  checkContent: async (content: string) => {
    try {
      const { data } = await supabase.rpc('check_content_filters', {
        content_text: content
      })

      return data?.is_allowed || true
    } catch (error) {
      console.error('Error checking content:', error)
      return true // Allow by default if check fails
    }
  }
}))