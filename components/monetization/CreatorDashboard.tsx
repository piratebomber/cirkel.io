'use client'

import { useEffect, useState } from 'react'
import { useMonetizationStore } from '@/store/monetizationStore'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Gift, 
  CreditCard, 
  BarChart3,
  Plus,
  Settings
} from 'lucide-react'

export function CreatorDashboard() {
  const { user } = useAuth()
  const {
    earnings,
    subscriptions,
    getEarnings,
    createSubscription,
    requestPayout
  } = useMonetizationStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateTier, setShowCreateTier] = useState(false)
  const [newTier, setNewTier] = useState({
    name: '',
    price: '',
    description: '',
    benefits: ['']
  })

  useEffect(() => {
    if (user && !user.isGuest) {
      loadEarnings()
    }
  }, [user])

  const loadEarnings = async () => {
    setIsLoading(true)
    try {
      await getEarnings(user!.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTier = async () => {
    try {
      await createSubscription({
        ...newTier,
        price: parseFloat(newTier.price),
        benefits: newTier.benefits.filter(b => b.trim())
      })
      setShowCreateTier(false)
      setNewTier({ name: '', price: '', description: '', benefits: [''] })
    } catch (error) {
      console.error('Create tier error:', error)
    }
  }

  const handlePayout = async () => {
    if (earnings.pending > 0) {
      try {
        await requestPayout(earnings.pending)
      } catch (error) {
        console.error('Payout error:', error)
      }
    }
  }

  if (user?.isGuest) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <DollarSign className="w-12 h-12 text-cirkel-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Creator Monetization</h3>
        <p className="text-muted-foreground mb-4">
          Start earning from your content with subscriptions, tips, and more
        </p>
        <Button onClick={() => window.location.href = '/auth/register'}>
          Get Started
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Creator Dashboard</h2>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Earnings</p>
                  <p className="text-2xl font-bold">${earnings.total?.toFixed(2) || '0.00'}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">This Month</p>
                  <p className="text-2xl font-bold">${earnings.thisMonth?.toFixed(2) || '0.00'}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Pending</p>
                  <p className="text-2xl font-bold">${earnings.pending?.toFixed(2) || '0.00'}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </div>
        )}

        {earnings.pending > 0 && (
          <Button onClick={handlePayout} className="mb-6">
            Request Payout (${earnings.pending.toFixed(2)})
          </Button>
        )}
      </div>

      {/* Subscription Tiers */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Subscription Tiers</h3>
          <Button onClick={() => setShowCreateTier(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Tier
          </Button>
        </div>

        {showCreateTier && (
          <div className="mb-6 p-4 border border-border rounded-lg">
            <h4 className="font-medium mb-4">Create New Subscription Tier</h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tier Name</label>
                  <input
                    type="text"
                    value={newTier.name}
                    onChange={(e) => setNewTier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Premium Supporter"
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Price ($)</label>
                  <input
                    type="number"
                    value={newTier.price}
                    onChange={(e) => setNewTier(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="9.99"
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newTier.description}
                  onChange={(e) => setNewTier(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what subscribers get..."
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Benefits</label>
                {newTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => {
                        const newBenefits = [...newTier.benefits]
                        newBenefits[index] = e.target.value
                        setNewTier(prev => ({ ...prev, benefits: newBenefits }))
                      }}
                      placeholder="e.g., Exclusive content access"
                      className="input-field flex-1"
                    />
                    {index === newTier.benefits.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setNewTier(prev => ({ 
                          ...prev, 
                          benefits: [...prev.benefits, ''] 
                        }))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTier}>Create Tier</Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateTier(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subscriptions.map(tier => (
            <div key={tier.id} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{tier.name}</h4>
                <span className="text-lg font-bold text-cirkel-500">
                  ${tier.price}/mo
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {tier.description}
              </p>
              
              <div className="space-y-1 mb-4">
                {tier.benefits?.map((benefit: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-cirkel-500 rounded-full" />
                    {benefit}
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                {tier.subscriberCount || 0} subscribers
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto p-4 flex-col">
            <Gift className="w-6 h-6 mb-2" />
            <span>Enable Tips</span>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col">
            <BarChart3 className="w-6 h-6 mb-2" />
            <span>View Analytics</span>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col">
            <CreditCard className="w-6 h-6 mb-2" />
            <span>Payment Settings</span>
          </Button>
          
          <Button variant="outline" className="h-auto p-4 flex-col">
            <TrendingUp className="w-6 h-6 mb-2" />
            <span>Promote Content</span>
          </Button>
        </div>
      </div>
    </div>
  )
}