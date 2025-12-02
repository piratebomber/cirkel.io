import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface IntegrationStore {
  connectedApps: any[]
  webhooks: any[]
  apiKeys: any[]
  crossPosts: any[]
  
  // Third-party integrations
  connectApp: (app: string, credentials: any) => Promise<void>
  disconnectApp: (appId: string) => Promise<void>
  
  // API Management
  createApiKey: (name: string, permissions: string[]) => Promise<string>
  revokeApiKey: (keyId: string) => Promise<void>
  
  // Webhooks
  createWebhook: (webhook: any) => Promise<void>
  testWebhook: (webhookId: string) => Promise<void>
  
  // Cross-posting
  crossPost: (postId: string, platforms: string[]) => Promise<void>
  
  // Calendar integration
  syncCalendar: (provider: string) => Promise<void>
  
  // Music/Video embeds
  embedContent: (url: string) => Promise<any>
}

export const useIntegrationStore = create<IntegrationStore>()(
  persist(
    (set, get) => ({
      connectedApps: [],
      webhooks: [],
      apiKeys: [],
      crossPosts: [],

      connectApp: async (app: string, credentials: any) => {
        try {
          const response = await fetch('/api/integrations/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ app, credentials })
          })

          if (response.ok) {
            const { data } = await response.json()
            
            set(state => ({
              connectedApps: [...state.connectedApps, data]
            }))

            toast.success(`Connected to ${app}!`)
          } else {
            toast.error(`Failed to connect to ${app}`)
          }
        } catch (error) {
          console.error('Connect app error:', error)
          toast.error('Connection failed')
        }
      },

      disconnectApp: async (appId: string) => {
        try {
          await fetch(`/api/integrations/disconnect/${appId}`, {
            method: 'DELETE'
          })

          set(state => ({
            connectedApps: state.connectedApps.filter(app => app.id !== appId)
          }))

          toast.success('App disconnected')
        } catch (error) {
          console.error('Disconnect app error:', error)
          toast.error('Failed to disconnect app')
        }
      },

      createApiKey: async (name: string, permissions: string[]) => {
        try {
          const response = await fetch('/api/developer/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, permissions })
          })

          const { apiKey, data } = await response.json()

          set(state => ({
            apiKeys: [...state.apiKeys, data]
          }))

          toast.success('API key created!')
          return apiKey
        } catch (error) {
          console.error('Create API key error:', error)
          toast.error('Failed to create API key')
          throw error
        }
      },

      revokeApiKey: async (keyId: string) => {
        try {
          await fetch(`/api/developer/keys/${keyId}`, {
            method: 'DELETE'
          })

          set(state => ({
            apiKeys: state.apiKeys.filter(key => key.id !== keyId)
          }))

          toast.success('API key revoked')
        } catch (error) {
          console.error('Revoke API key error:', error)
          toast.error('Failed to revoke API key')
        }
      },

      createWebhook: async (webhook: any) => {
        try {
          const { data } = await supabase
            .from('webhooks')
            .insert({
              ...webhook,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          set(state => ({
            webhooks: [...state.webhooks, data]
          }))

          toast.success('Webhook created!')
        } catch (error) {
          console.error('Create webhook error:', error)
          toast.error('Failed to create webhook')
        }
      },

      testWebhook: async (webhookId: string) => {
        try {
          const response = await fetch(`/api/webhooks/test/${webhookId}`, {
            method: 'POST'
          })

          if (response.ok) {
            toast.success('Webhook test successful!')
          } else {
            toast.error('Webhook test failed')
          }
        } catch (error) {
          console.error('Test webhook error:', error)
          toast.error('Webhook test failed')
        }
      },

      crossPost: async (postId: string, platforms: string[]) => {
        try {
          const response = await fetch('/api/integrations/cross-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, platforms })
          })

          if (response.ok) {
            const { results } = await response.json()
            
            set(state => ({
              crossPosts: [...state.crossPosts, { postId, platforms, results }]
            }))

            toast.success('Cross-posted successfully!')
          } else {
            toast.error('Cross-posting failed')
          }
        } catch (error) {
          console.error('Cross-post error:', error)
          toast.error('Cross-posting failed')
        }
      },

      syncCalendar: async (provider: string) => {
        try {
          const response = await fetch('/api/integrations/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider })
          })

          if (response.ok) {
            toast.success('Calendar synced!')
          } else {
            toast.error('Calendar sync failed')
          }
        } catch (error) {
          console.error('Calendar sync error:', error)
          toast.error('Calendar sync failed')
        }
      },

      embedContent: async (url: string) => {
        try {
          const response = await fetch('/api/integrations/embed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          })

          const embedData = await response.json()
          return embedData
        } catch (error) {
          console.error('Embed content error:', error)
          return null
        }
      }
    }),
    { name: 'cirkel-integrations' }
  )
)

// Platform-specific integration helpers
export const INTEGRATION_PLATFORMS = {
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    authUrl: '/api/integrations/twitter/auth',
    scopes: ['tweet.read', 'tweet.write', 'users.read']
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    authUrl: '/api/integrations/instagram/auth',
    scopes: ['user_profile', 'user_media']
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    authUrl: '/api/integrations/linkedin/auth',
    scopes: ['r_liteprofile', 'w_member_social']
  },
  youtube: {
    name: 'YouTube',
    icon: '📺',
    authUrl: '/api/integrations/youtube/auth',
    scopes: ['youtube.readonly', 'youtube.upload']
  },
  spotify: {
    name: 'Spotify',
    icon: '🎵',
    authUrl: '/api/integrations/spotify/auth',
    scopes: ['user-read-playback-state', 'playlist-modify-public']
  },
  discord: {
    name: 'Discord',
    icon: '🎮',
    authUrl: '/api/integrations/discord/auth',
    scopes: ['identify', 'guilds']
  },
  slack: {
    name: 'Slack',
    icon: '💬',
    authUrl: '/api/integrations/slack/auth',
    scopes: ['chat:write', 'channels:read']
  },
  notion: {
    name: 'Notion',
    icon: '📝',
    authUrl: '/api/integrations/notion/auth',
    scopes: ['read', 'write']
  },
  google_calendar: {
    name: 'Google Calendar',
    icon: '📅',
    authUrl: '/api/integrations/google-calendar/auth',
    scopes: ['calendar.readonly', 'calendar.events']
  },
  github: {
    name: 'GitHub',
    icon: '🐙',
    authUrl: '/api/integrations/github/auth',
    scopes: ['repo', 'user']
  }
}