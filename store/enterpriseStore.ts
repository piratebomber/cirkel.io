import { create } from 'zustand'
import { supabase } from '@/lib/susupabase'
import { toast } from 'react-hot-toast'

interface EnterpriseStore {
  businessProfile: any
  team: any[]
  campaigns: any[]
  analytics: any
  brandSafety: any
  ssoConfig: any
  
  // Business Profile
  createBusinessProfile: (profile: any) => Promise<void>
  updateBusinessProfile: (updates: any) => Promise<void>
  verifyBusiness: (documents: any[]) => Promise<void>
  
  // Team Management
  inviteTeamMember: (email: string, role: string) => Promise<void>
  removeTeamMember: (memberId: string) => Promise<void>
  updateMemberRole: (memberId: string, role: string) => Promise<void>
  
  // Advertising Platform
  createCampaign: (campaign: any) => Promise<string>
  updateCampaign: (campaignId: string, updates: any) => Promise<void>
  pauseCampaign: (campaignId: string) => Promise<void>
  getCampaignAnalytics: (campaignId: string) => Promise<any>
  
  // Brand Safety
  setBrandSafetyRules: (rules: any) => Promise<void>
  checkBrandSafety: (content: string) => Promise<boolean>
  
  // Enterprise SSO
  configureSSOProvider: (provider: any) => Promise<void>
  enableSSO: () => Promise<void>
  
  // Advanced Analytics
  getBusinessAnalytics: (timeframe: string) => Promise<any>
  exportAnalytics: (format: string) => Promise<void>
}

export const useEnterpriseStore = create<EnterpriseStore>((set, get) => ({
  businessProfile: null,
  team: [],
  campaigns: [],
  analytics: null,
  brandSafety: null,
  ssoConfig: null,

  createBusinessProfile: async (profile: any) => {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .insert({
          ...profile,
          status: 'pending_verification',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set({ businessProfile: data })
      toast.success('Business profile created!')
    } catch (error) {
      console.error('Create business profile error:', error)
      toast.error('Failed to create business profile')
    }
  },

  updateBusinessProfile: async (updates: any) => {
    try {
      const { data } = await supabase
        .from('business_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      set({ businessProfile: data })
      toast.success('Business profile updated!')
    } catch (error) {
      console.error('Update business profile error:', error)
      toast.error('Failed to update business profile')
    }
  },

  verifyBusiness: async (documents: any[]) => {
    try {
      await supabase
        .from('business_verifications')
        .insert({
          documents,
          status: 'pending',
          submitted_at: new Date().toISOString()
        })

      toast.success('Verification documents submitted!')
    } catch (error) {
      console.error('Business verification error:', error)
      toast.error('Failed to submit verification')
    }
  },

  inviteTeamMember: async (email: string, role: string) => {
    try {
      const { data } = await supabase
        .from('team_invitations')
        .insert({
          email,
          role,
          status: 'pending',
          invited_at: new Date().toISOString()
        })
        .select()
        .single()

      // Send invitation email
      await fetch('/api/enterprise/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, invitationId: data.id })
      })

      toast.success('Team member invited!')
    } catch (error) {
      console.error('Invite team member error:', error)
      toast.error('Failed to invite team member')
    }
  },

  removeTeamMember: async (memberId: string) => {
    try {
      await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      set(state => ({
        team: state.team.filter(member => member.id !== memberId)
      }))

      toast.success('Team member removed')
    } catch (error) {
      console.error('Remove team member error:', error)
      toast.error('Failed to remove team member')
    }
  },

  updateMemberRole: async (memberId: string, role: string) => {
    try {
      await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId)

      set(state => ({
        team: state.team.map(member =>
          member.id === memberId ? { ...member, role } : member
        )
      }))

      toast.success('Member role updated')
    } catch (error) {
      console.error('Update member role error:', error)
      toast.error('Failed to update member role')
    }
  },

  createCampaign: async (campaign: any) => {
    try {
      const { data } = await supabase
        .from('ad_campaigns')
        .insert({
          ...campaign,
          status: 'draft',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        campaigns: [...state.campaigns, data]
      }))

      toast.success('Campaign created!')
      return data.id
    } catch (error) {
      console.error('Create campaign error:', error)
      toast.error('Failed to create campaign')
      throw error
    }
  },

  updateCampaign: async (campaignId: string, updates: any) => {
    try {
      await supabase
        .from('ad_campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      set(state => ({
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId ? { ...campaign, ...updates } : campaign
        )
      }))

      toast.success('Campaign updated!')
    } catch (error) {
      console.error('Update campaign error:', error)
      toast.error('Failed to update campaign')
    }
  },

  pauseCampaign: async (campaignId: string) => {
    try {
      await supabase
        .from('ad_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)

      set(state => ({
        campaigns: state.campaigns.map(campaign =>
          campaign.id === campaignId ? { ...campaign, status: 'paused' } : campaign
        )
      }))

      toast.success('Campaign paused')
    } catch (error) {
      console.error('Pause campaign error:', error)
      toast.error('Failed to pause campaign')
    }
  },

  getCampaignAnalytics: async (campaignId: string) => {
    try {
      const { data } = await supabase.rpc('get_campaign_analytics', {
        campaign_id: campaignId
      })

      return data
    } catch (error) {
      console.error('Campaign analytics error:', error)
      return null
    }
  },

  setBrandSafetyRules: async (rules: any) => {
    try {
      await supabase
        .from('brand_safety_rules')
        .upsert({
          rules,
          updated_at: new Date().toISOString()
        })

      set({ brandSafety: rules })
      toast.success('Brand safety rules updated!')
    } catch (error) {
      console.error('Brand safety rules error:', error)
      toast.error('Failed to update brand safety rules')
    }
  },

  checkBrandSafety: async (content: string) => {
    try {
      const response = await fetch('/api/enterprise/brand-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const { isSafe } = await response.json()
      return isSafe
    } catch (error) {
      console.error('Brand safety check error:', error)
      return true // Default to safe if check fails
    }
  },

  configureSSOProvider: async (provider: any) => {
    try {
      await supabase
        .from('sso_configurations')
        .upsert({
          ...provider,
          updated_at: new Date().toISOString()
        })

      set({ ssoConfig: provider })
      toast.success('SSO provider configured!')
    } catch (error) {
      console.error('SSO configuration error:', error)
      toast.error('Failed to configure SSO')
    }
  },

  enableSSO: async () => {
    try {
      await supabase
        .from('sso_configurations')
        .update({ enabled: true })

      set(state => ({
        ssoConfig: { ...state.ssoConfig, enabled: true }
      }))

      toast.success('SSO enabled!')
    } catch (error) {
      console.error('Enable SSO error:', error)
      toast.error('Failed to enable SSO')
    }
  },

  getBusinessAnalytics: async (timeframe: string) => {
    try {
      const { data } = await supabase.rpc('get_business_analytics', {
        timeframe
      })

      set({ analytics: data })
      return data
    } catch (error) {
      console.error('Business analytics error:', error)
      return null
    }
  },

  exportAnalytics: async (format: string) => {
    try {
      const response = await fetch('/api/enterprise/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-export.${format}`
        a.click()

        toast.success('Analytics exported!')
      }
    } catch (error) {
      console.error('Export analytics error:', error)
      toast.error('Failed to export analytics')
    }
  }
}))

// Enterprise role permissions
export const ENTERPRISE_ROLES = {
  owner: {
    name: 'Owner',
    permissions: ['*'] // All permissions
  },
  admin: {
    name: 'Administrator',
    permissions: [
      'manage_team',
      'manage_campaigns',
      'view_analytics',
      'manage_brand_safety',
      'configure_sso'
    ]
  },
  manager: {
    name: 'Manager',
    permissions: [
      'create_campaigns',
      'edit_campaigns',
      'view_analytics',
      'manage_content'
    ]
  },
  analyst: {
    name: 'Analyst',
    permissions: [
      'view_analytics',
      'export_data',
      'create_reports'
    ]
  },
  creator: {
    name: 'Content Creator',
    permissions: [
      'create_content',
      'schedule_posts',
      'view_performance'
    ]
  }
}

export const hasPermission = (userRole: string, permission: string): boolean => {
  const role = ENTERPRISE_ROLES[userRole as keyof typeof ENTERPRISE_ROLES]
  if (!role) return false
  
  return role.permissions.includes('*') || role.permissions.includes(permission)
}