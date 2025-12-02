import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthState } from '@/types'
import { supabase, signIn, signOut, signUp, getCurrentUser } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  createGuestSession: () => void
  checkUsernameAvailability: (username: string) => Promise<boolean>
  updateUsername: (newUsername: string) => Promise<void>
  canChangeUsername: () => boolean
  
  // Guest mode
  isGuest: boolean
  setGuestMode: (isGuest: boolean) => void
  
  // Loading states
  isLoggingIn: boolean
  isRegistering: boolean
  isUpdating: boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      token: null,
      isGuest: false,
      isLoggingIn: false,
      isRegistering: false,
      isUpdating: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoggingIn: true })
        try {
          // Validate email domain
          const emailDomain = email.split('@')[1]
          const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'wemail.go']
          
          if (!allowedDomains.includes(emailDomain)) {
            throw new Error('Email domain not supported. Please use Gmail, Outlook, Yahoo, or wemail.go')
          }

          // Special handling for wemail.go - only cirkelio@wemail.go is allowed
          if (emailDomain === 'wemail.go' && email !== 'cirkelio@wemail.go') {
            throw new Error('Only cirkelio@wemail.go is allowed for wemail.go domain')
          }

          const { user, session } = await signIn(email, password)
          
          if (user && session) {
            // Fetch full user profile from database
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()

            set({
              user: userProfile,
              isAuthenticated: true,
              token: session.access_token,
              isGuest: false,
              isLoggingIn: false,
            })

            toast.success('Welcome back!')
          }
        } catch (error: any) {
          set({ isLoggingIn: false })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      register: async (email: string, password: string, userData: Partial<User>) => {
        set({ isRegistering: true })
        try {
          // Validate email domain
          const emailDomain = email.split('@')[1]
          const allowedDomains = ['gmail.com', 'outlook.com', 'yahoo.com', 'wemail.go']
          
          if (!allowedDomains.includes(emailDomain)) {
            throw new Error('Email domain not supported. Please use Gmail, Outlook, Yahoo, or wemail.go')
          }

          // Special handling for wemail.go - only cirkelio@wemail.go is allowed
          if (emailDomain === 'wemail.go' && email !== 'cirkelio@wemail.go') {
            throw new Error('Only cirkelio@wemail.go is allowed for wemail.go domain')
          }

          // Check username availability
          const isUsernameAvailable = await get().checkUsernameAvailability(userData.username!)
          if (!isUsernameAvailable) {
            throw new Error('Username is already taken')
          }

          const { user } = await signUp(email, password, {
            username: userData.username,
            display_name: userData.displayName,
          })

          if (user) {
            // Create user profile in database
            const newUser = {
              id: user.id,
              email: user.email!,
              username: userData.username!,
              display_name: userData.displayName!,
              bio: userData.bio || '',
              pronouns: userData.pronouns || '',
              is_verified: false,
              follower_count: 0,
              following_count: 0,
              post_count: 0,
              is_guest: false,
              theme: 'default',
              joined_at: new Date().toISOString(),
              notifications: {
                email: true,
                push: true,
                likes: true,
                reposts: true,
                comments: true,
                follows: true,
                mentions: true,
                messages: true,
                community_activity: true,
                achievements: true,
                system_updates: true,
              },
              privacy: {
                profile_visibility: 'public',
                message_permissions: 'everyone',
                show_activity: true,
                show_followers: true,
                show_following: true,
                indexable: true,
              },
              gamification: {
                level: 1,
                xp: 0,
                badges: [],
                achievements: [],
                streak: 0,
                last_activity: new Date().toISOString(),
              },
              social_links: [],
            }

            await supabase.from('users').insert(newUser)

            set({
              user: newUser as User,
              isAuthenticated: true,
              isGuest: false,
              isRegistering: false,
            })

            toast.success('Account created successfully!')
          }
        } catch (error: any) {
          set({ isRegistering: false })
          toast.error(error.message || 'Registration failed')
          throw error
        }
      },

      logout: async () => {
        try {
          await signOut()
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            isGuest: false,
          })
          toast.success('Logged out successfully')
        } catch (error: any) {
          toast.error('Logout failed')
          throw error
        }
      },

      refreshUser: async () => {
        try {
          const user = await getCurrentUser()
          if (user) {
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()

            set({
              user: userProfile,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { user } = get()
        if (!user) return

        set({ isUpdating: true })
        try {
          const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)

          if (error) throw error

          set({
            user: { ...user, ...updates },
            isUpdating: false,
          })

          toast.success('Profile updated successfully')
        } catch (error: any) {
          set({ isUpdating: false })
          toast.error(error.message || 'Update failed')
          throw error
        }
      },

      createGuestSession: () => {
        const guestUser: User = {
          id: 'guest',
          username: 'guest',
          displayName: 'Guest User',
          email: '',
          isVerified: false,
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
          joinedAt: new Date(),
          isGuest: true,
          theme: 'default',
          notifications: {
            email: false,
            push: false,
            likes: false,
            reposts: false,
            comments: false,
            follows: false,
            mentions: false,
            messages: false,
            communityActivity: false,
            achievements: false,
            systemUpdates: false,
          },
          privacy: {
            profileVisibility: 'public',
            messagePermissions: 'none',
            showActivity: false,
            showFollowers: false,
            showFollowing: false,
            indexable: false,
          },
          gamification: {
            level: 0,
            xp: 0,
            badges: [],
            achievements: [],
            streak: 0,
            lastActivity: new Date(),
          },
          socialLinks: [],
        }

        set({
          user: guestUser,
          isAuthenticated: false,
          isGuest: true,
          isLoading: false,
        })

        toast.success('Browsing as guest')
      },

      setGuestMode: (isGuest: boolean) => {
        set({ isGuest })
      },

      checkUsernameAvailability: async (username: string) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single()

          return !data // Available if no user found
        } catch (error) {
          return true // Available if error (likely no user found)
        }
      },

      updateUsername: async (newUsername: string) => {
        const { user } = get()
        if (!user || user.isGuest) return

        // Check if user can change username (30-day limit)
        if (!get().canChangeUsername()) {
          throw new Error('You can only change your username once every 30 days')
        }

        // Check availability
        const isAvailable = await get().checkUsernameAvailability(newUsername)
        if (!isAvailable) {
          throw new Error('Username is already taken')
        }

        try {
          const updates = {
            username: newUsername,
            last_username_change: new Date().toISOString(),
          }

          await get().updateUser(updates)
          toast.success('Username updated successfully')
        } catch (error: any) {
          toast.error(error.message || 'Failed to update username')
          throw error
        }
      },

      canChangeUsername: () => {
        const { user } = get()
        if (!user || user.isGuest || !user.lastUsernameChange) return true

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        return new Date(user.lastUsernameChange) < thirtyDaysAgo
      },
    }),
    {
      name: 'cirkel-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        isGuest: state.isGuest,
      }),
    }
  )
)

// Initialize auth state on app start
if (typeof window !== 'undefined') {
  useAuthStore.getState().refreshUser()
}