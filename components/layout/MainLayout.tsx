'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { CreatePostModal } from '@/components/posts/CreatePostModal'
import { SearchModal } from '@/components/search/SearchModal'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { MessagingPanel } from '@/components/messaging/MessagingPanel'
import { SettingsModal } from '@/components/settings/SettingsModal'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMessagingOpen, setIsMessagingOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 xl:w-80">
          <div className="fixed h-full w-64 xl:w-80">
            <Sidebar
              onCreatePost={() => setIsCreatePostOpen(true)}
              onSearch={() => setIsSearchOpen(true)}
              onNotifications={() => setIsNotificationsOpen(true)}
              onMessages={() => setIsMessagingOpen(true)}
              onSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen border-x border-border">
          <main className="flex">
            {children}
          </main>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav
            onCreatePost={() => setIsCreatePostOpen(true)}
            onSearch={() => setIsSearchOpen(true)}
            onNotifications={() => setIsNotificationsOpen(true)}
            onMessages={() => setIsMessagingOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NotificationPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <MessagingPanel
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}