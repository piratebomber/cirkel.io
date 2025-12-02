'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>
  logout: () => Promise<void>
  createGuestSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    isGuest,
    login,
    register,
    logout,
    createGuestSession,
    refreshUser,
  } = useAuthStore()

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          useAuthStore.setState({
            user: null,
            isAuthenticated: false,
            token: null,
            isGuest: false,
          })
        }
        
        if (!initialized) {
          setInitialized(true)
        }
      }
    )

    // Initial auth check
    refreshUser().finally(() => {
      if (!initialized) {
        setInitialized(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshUser, initialized])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: isLoading || !initialized,
    isGuest,
    login,
    register,
    logout,
    createGuestSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}