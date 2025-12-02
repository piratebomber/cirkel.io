'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { MainLayout } from '@/components/layout/MainLayout'
import { HomeFeed } from '@/components/feed/HomeFeed'
import { TrendingSidebar } from '@/components/sidebar/TrendingSidebar'
import { WhoToFollowSidebar } from '@/components/sidebar/WhoToFollowSidebar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, isAuthenticated, isLoading, isGuest } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, isGuest, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated && !isGuest) {
    return null
  }

  return (
    <MainLayout>
      <div className="flex-1 max-w-2xl">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-bold">Home</h1>
            <div className="flex items-center gap-2">
              {isGuest && (
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Guest Mode
                </span>
              )}
            </div>
          </div>
        </div>
        
        <HomeFeed />
      </div>

      <div className="hidden lg:block w-80 space-y-4">
        <TrendingSidebar />
        <WhoToFollowSidebar />
      </div>
    </MainLayout>
  )
}