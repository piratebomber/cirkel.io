import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface MonetizationStore {
  subscriptions: any[]
  earnings: any
  sponsoredPosts: any[]
  premiumFeatures: any
  marketplace: any[]
  paymentMethods: any[]
  
  // Creator Economy
  createSubscription: (tier: any) => Promise<void>
  subscribeTo: (creatorId: string, tierId: string) => Promise<void>
  sendTip: (userId: string, amount: number, message?: string) => Promise<void>
  createSponsoredPost: (postData: any, budget: number) => Promise<void>
  
  // Premium Features
  upgradeToPremium: () => Promise<void>
  getPremiumFeatures: () => Promise<void>
  
  // Marketplace
  createMarketplaceListing: (item: any) => Promise<void>
  purchaseItem: (itemId: string) => Promise<void>
  
  // Revenue
  getEarnings: (userId: string) => Promise<void>
  requestPayout: (amount: number) => Promise<void>
  
  // Ads
  createAdCampaign: (campaign: any) => Promise<void>
  getAdAnalytics: (campaignId: string) => Promise<void>
}

export const useMonetizationStore = create<MonetizationStore>((set, get) => ({
  subscriptions: [],
  earnings: { total: 0, thisMonth: 0, pending: 0 },
  sponsoredPosts: [],
  premiumFeatures: {
    isActive: false,
    features: [],
    expiresAt: null
  },
  marketplace: [],
  paymentMethods: [],

  createSubscription: async (tier: any) => {
    try {
      const { data } = await supabase
        .from('subscription_tiers')
        .insert({
          ...tier,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        subscriptions: [...state.subscriptions, data]
      }))

      toast.success('Subscription tier created!')
    } catch (error) {
      console.error('Create subscription error:', error)
      toast.error('Failed to create subscription')
    }
  },

  subscribeTo: async (creatorId: string, tierId: string) => {
    try {
      const response = await fetch('/api/monetization/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, tierId })
      })

      if (response.ok) {
        toast.success('Successfully subscribed!')
      } else {
        toast.error('Subscription failed')
      }
    } catch (error) {
      console.error('Subscribe error:', error)
      toast.error('Failed to subscribe')
    }
  },

  sendTip: async (userId: string, amount: number, message?: string) => {
    try {
      const response = await fetch('/api/monetization/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount, message })
      })

      if (response.ok) {
        toast.success(`Tip of $${amount} sent!`)
      } else {
        toast.error('Tip failed')
      }
    } catch (error) {
      console.error('Tip error:', error)
      toast.error('Failed to send tip')
    }
  },

  createSponsoredPost: async (postData: any, budget: number) => {
    try {
      const { data } = await supabase
        .from('sponsored_posts')
        .insert({
          ...postData,
          budget,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        sponsoredPosts: [...state.sponsoredPosts, data]
      }))

      toast.success('Sponsored post created!')
    } catch (error) {
      console.error('Sponsored post error:', error)
      toast.error('Failed to create sponsored post')
    }
  },

  upgradeToPremium: async () => {
    try {
      const response = await fetch('/api/monetization/premium/upgrade', {
        method: 'POST'
      })

      if (response.ok) {
        set(state => ({
          premiumFeatures: {
            ...state.premiumFeatures,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }))
        toast.success('Upgraded to Premium!')
      }
    } catch (error) {
      console.error('Premium upgrade error:', error)
      toast.error('Failed to upgrade')
    }
  },

  getPremiumFeatures: async () => {
    try {
      const { data } = await supabase
        .from('premium_features')
        .select('*')
        .single()

      set({ premiumFeatures: data })
    } catch (error) {
      console.error('Get premium features error:', error)
    }
  },

  createMarketplaceListing: async (item: any) => {
    try {
      const { data } = await supabase
        .from('marketplace_items')
        .insert({
          ...item,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        marketplace: [...state.marketplace, data]
      }))

      toast.success('Item listed in marketplace!')
    } catch (error) {
      console.error('Marketplace listing error:', error)
      toast.error('Failed to list item')
    }
  },

  purchaseItem: async (itemId: string) => {
    try {
      const response = await fetch('/api/monetization/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      })

      if (response.ok) {
        toast.success('Purchase successful!')
      } else {
        toast.error('Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Failed to purchase item')
    }
  },

  getEarnings: async (userId: string) => {
    try {
      const { data } = await supabase.rpc('get_user_earnings', {
        user_id: userId
      })

      set({ earnings: data })
    } catch (error) {
      console.error('Get earnings error:', error)
    }
  },

  requestPayout: async (amount: number) => {
    try {
      const response = await fetch('/api/monetization/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })

      if (response.ok) {
        toast.success('Payout requested!')
      } else {
        toast.error('Payout failed')
      }
    } catch (error) {
      console.error('Payout error:', error)
      toast.error('Failed to request payout')
    }
  },

  createAdCampaign: async (campaign: any) => {
    try {
      const { data } = await supabase
        .from('ad_campaigns')
        .insert({
          ...campaign,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      toast.success('Ad campaign created!')
    } catch (error) {
      console.error('Ad campaign error:', error)
      toast.error('Failed to create campaign')
    }
  },

  getAdAnalytics: async (campaignId: string) => {
    try {
      const { data } = await supabase
        .from('ad_analytics')
        .select('*')
        .eq('campaign_id', campaignId)

      return data
    } catch (error) {
      console.error('Ad analytics error:', error)
      return []
    }
  }
}))