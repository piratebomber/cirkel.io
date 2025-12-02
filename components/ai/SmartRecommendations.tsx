'use client'

import { useEffect, useState } from 'react'
import { useAIStore } from '@/store/aiStore'
import { useAuth } from '@/components/providers/AuthProvider'
import { PostCard } from '@/components/posts/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Sparkles, TrendingUp, Users, Hash } from 'lucide-react'

export function SmartRecommendations() {
  const { user } = useAuth()
  const { 
    recommendations, 
    suggestedUsers, 
    suggestedHashtags,
    getContentRecommendations,
    suggestUsers,
    generateHashtags
  } = useAIStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'users' | 'hashtags'>('posts')

  useEffect(() => {
    if (user && !user.isGuest) {
      loadRecommendations()
    }
  }, [user])

  const loadRecommendations = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        getContentRecommendations(user!.id),
        suggestUsers(user!.id),
        generateHashtags('')
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (user?.isGuest) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <Sparkles className="w-12 h-12 text-cirkel-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI-Powered Recommendations</h3>
        <p className="text-muted-foreground mb-4">
          Sign up to get personalized content recommendations powered by AI
        </p>
        <Button onClick={() => window.location.href = '/auth/register'}>
          Get Started
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-cirkel-500" />
          <h3 className="font-semibold">AI Recommendations</h3>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-cirkel-500 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Posts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-cirkel-500 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('hashtags')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'hashtags'
                ? 'bg-cirkel-500 text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-1" />
            Tags
          </button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 3).map(post => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No recommendations available yet
                  </p>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-3">
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.slice(0, 5).map(suggestedUser => (
                    <div key={suggestedUser.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={suggestedUser.profilePicture}
                          alt={suggestedUser.displayName}
                          size="sm"
                          verified={suggestedUser.isVerified}
                        />
                        <div>
                          <p className="font-medium">{suggestedUser.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{suggestedUser.username}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Follow
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No user suggestions available
                  </p>
                )}
              </div>
            )}

            {activeTab === 'hashtags' && (
              <div className="space-y-2">
                {suggestedHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestedHashtags.slice(0, 10).map(hashtag => (
                      <button
                        key={hashtag}
                        className="px-3 py-1 bg-muted hover:bg-accent rounded-full text-sm font-medium transition-colors"
                        onClick={() => window.location.href = `/hashtag/${hashtag}`}
                      >
                        #{hashtag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hashtag suggestions available
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}