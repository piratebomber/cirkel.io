'use client'

import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useAuth } from '@/components/providers/AuthProvider'
import { PostCard } from '@/components/posts/PostCard'
import { CreatePostForm } from '@/components/posts/CreatePostForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { usePostStore } from '@/store/postStore'
import { Post } from '@/types'
import { RefreshCw, TrendingUp, Clock, Users } from 'lucide-react'

type FeedFilter = 'algorithm' | 'following' | 'trending' | 'recent'

export function HomeFeed() {
  const { user, isAuthenticated, isGuest } = useAuth()
  const { 
    posts, 
    isLoading, 
    hasMore, 
    fetchFeed, 
    refreshFeed,
    fetchTrendingPosts,
    fetchFollowingPosts 
  } = usePostStore()
  
  const [filter, setFilter] = useState<FeedFilter>('algorithm')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  })

  useEffect(() => {
    if (user && !isGuest) {
      loadFeed()
    }
  }, [user, isGuest, filter])

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMorePosts()
    }
  }, [inView, hasMore, isLoading])

  const loadFeed = async () => {
    if (!user) return

    try {
      switch (filter) {
        case 'algorithm':
          await fetchFeed(user.id, true)
          break
        case 'following':
          await fetchFollowingPosts(user.id, true)
          break
        case 'trending':
          await fetchTrendingPosts(true)
          break
        case 'recent':
          await fetchFeed(user.id, true, 'recent')
          break
      }
    } catch (error) {
      console.error('Error loading feed:', error)
    }
  }

  const loadMorePosts = async () => {
    if (!user || isLoading) return

    try {
      switch (filter) {
        case 'algorithm':
          await fetchFeed(user.id, false)
          break
        case 'following':
          await fetchFollowingPosts(user.id, false)
          break
        case 'trending':
          await fetchTrendingPosts(false)
          break
        case 'recent':
          await fetchFeed(user.id, false, 'recent')
          break
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshFeed(user?.id || '')
    } finally {
      setIsRefreshing(false)
    }
  }

  const filterOptions = [
    {
      key: 'algorithm' as FeedFilter,
      label: 'For You',
      icon: TrendingUp,
      description: 'Personalized feed based on your interests',
    },
    {
      key: 'following' as FeedFilter,
      label: 'Following',
      icon: Users,
      description: 'Posts from people you follow',
      disabled: isGuest,
    },
    {
      key: 'trending' as FeedFilter,
      label: 'Trending',
      icon: TrendingUp,
      description: 'Popular posts right now',
    },
    {
      key: 'recent' as FeedFilter,
      label: 'Recent',
      icon: Clock,
      description: 'Latest posts from everyone',
    },
  ]

  if (isGuest) {
    return (
      <div className="space-y-4">
        {/* Guest Welcome */}
        <div className="p-6 bg-gradient-to-r from-cirkel-500 to-cirkel-600 text-white rounded-lg mx-4 mt-4">
          <h2 className="text-xl font-bold mb-2">Welcome to Cirkel.io!</h2>
          <p className="mb-4">You're browsing as a guest. Sign up to post, like, and interact with the community.</p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={() => window.location.href = '/auth/register'}
            >
              Sign Up
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/auth/login'}
              className="border-white text-white hover:bg-white hover:text-cirkel-500"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Feed Filters */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto px-4">
            {filterOptions.filter(option => !option.disabled).map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.key}
                  onClick={() => setFilter(option.key)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${filter === option.key
                      ? 'border-cirkel-500 text-cirkel-500 font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-0">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* Create Post Form */}
      {!isGuest && (
        <div className="border-b border-border">
          <CreatePostForm />
        </div>
      )}

      {/* Feed Filters */}
      <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex overflow-x-auto">
            {filterOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.key}
                  onClick={() => !option.disabled && setFilter(option.key)}
                  disabled={option.disabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap mr-2
                    ${filter === option.key
                      ? 'bg-cirkel-500 text-white'
                      : option.disabled
                      ? 'text-muted-foreground cursor-not-allowed opacity-50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }
                  `}
                  title={option.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-0">
        {isLoading && posts.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'following' 
                  ? "Follow some users to see their posts here"
                  : "Be the first to share something interesting!"
                }
              </p>
              {filter === 'following' && (
                <Button onClick={() => setFilter('trending')}>
                  Explore Trending
                </Button>
              )}
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>You've reached the end of your feed</p>
          <Button 
            variant="ghost" 
            onClick={handleRefresh}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Feed
          </Button>
        </div>
      )}
    </div>
  )
}