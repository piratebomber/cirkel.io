'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  Home, 
  Search, 
  Bell, 
  Mail, 
  User, 
  Users, 
  TrendingUp, 
  Settings, 
  PlusCircle,
  Hash,
  Bookmark,
  MoreHorizontal,
  LogOut,
  UserPlus
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Badge } from '@/components/ui/Badge'
import { useNotificationStore } from '@/store/notificationStore'

interface SidebarProps {
  onCreatePost: () => void
  onSearch: () => void
  onNotifications: () => void
  onMessages: () => void
  onSettings: () => void
}

export function Sidebar({ 
  onCreatePost, 
  onSearch, 
  onNotifications, 
  onMessages, 
  onSettings 
}: SidebarProps) {
  const { user, isAuthenticated, isGuest, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { unreadCount } = useNotificationStore()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Home',
      icon: Home,
      href: '/',
      onClick: () => router.push('/'),
      disabled: false,
    },
    {
      name: 'Explore',
      icon: Search,
      href: '/explore',
      onClick: () => router.push('/explore'),
      disabled: false,
    },
    {
      name: 'Notifications',
      icon: Bell,
      href: '/notifications',
      onClick: onNotifications,
      disabled: isGuest,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: 'Messages',
      icon: Mail,
      href: '/messages',
      onClick: onMessages,
      disabled: isGuest,
    },
    {
      name: 'Bookmarks',
      icon: Bookmark,
      href: '/bookmarks',
      onClick: () => router.push('/bookmarks'),
      disabled: isGuest,
    },
    {
      name: 'Communities',
      icon: Users,
      href: '/communities',
      onClick: () => router.push('/communities'),
      disabled: false,
    },
    {
      name: 'Trending',
      icon: TrendingUp,
      href: '/trending',
      onClick: () => router.push('/trending'),
      disabled: false,
    },
    {
      name: 'Profile',
      icon: User,
      href: user ? `/profile/${user.username}` : '/profile',
      onClick: () => user && router.push(`/profile/${user.username}`),
      disabled: isGuest,
    },
  ]

  const moreItems = [
    {
      name: 'Settings',
      icon: Settings,
      onClick: onSettings,
      disabled: isGuest,
    },
    {
      name: 'Help Center',
      icon: MoreHorizontal,
      onClick: () => router.push('/help'),
      disabled: false,
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cirkel-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-bold cirkel-text-gradient">cirkel.io</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <button
              key={item.name}
              onClick={item.onClick}
              disabled={item.disabled}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors
                ${isActive 
                  ? 'bg-cirkel-500 text-white' 
                  : 'hover:bg-accent text-foreground'
                }
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="font-medium xl:block hidden">{item.name}</span>
            </button>
          )
        })}

        {/* More dropdown */}
        <DropdownMenu
          trigger={
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-accent transition-colors">
              <MoreHorizontal className="w-6 h-6" />
              <span className="font-medium xl:block hidden">More</span>
            </button>
          }
          items={moreItems.map(item => ({
            label: item.name,
            icon: item.icon,
            onClick: item.onClick,
            disabled: item.disabled,
          }))}
        />
      </nav>

      {/* Create Post Button */}
      {!isGuest && (
        <div className="mb-4">
          <Button
            onClick={onCreatePost}
            className="w-full btn-primary flex items-center justify-center gap-2"
            size="lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="xl:block hidden">Create Post</span>
          </Button>
        </div>
      )}

      {/* User Profile */}
      {isAuthenticated && user && !isGuest ? (
        <DropdownMenu
          trigger={
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent cursor-pointer transition-colors">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName}
                size="md"
                verified={user.isVerified}
              />
              <div className="xl:block hidden flex-1 min-w-0">
                <p className="font-medium truncate">{user.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
          }
          items={[
            {
              label: 'View Profile',
              icon: User,
              onClick: () => router.push(`/profile/${user.username}`),
            },
            {
              label: 'Settings',
              icon: Settings,
              onClick: onSettings,
            },
            {
              label: 'Sign Out',
              icon: LogOut,
              onClick: handleLogout,
              variant: 'destructive',
            },
          ]}
        />
      ) : isGuest ? (
        <div className="space-y-2">
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full btn-primary"
          >
            Sign In
          </Button>
          <Button
            onClick={() => router.push('/auth/register')}
            variant="outline"
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up
          </Button>
        </div>
      ) : null}
    </div>
  )
}