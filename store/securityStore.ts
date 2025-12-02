import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface SecurityStore {
  twoFactorEnabled: boolean
  trustedDevices: any[]
  loginSessions: any[]
  privacySettings: any
  securityAlerts: any[]
  
  // Actions
  enableTwoFactor: () => Promise<string>
  verifyTwoFactor: (code: string) => Promise<boolean>
  disableTwoFactor: (code: string) => Promise<void>
  addTrustedDevice: (deviceInfo: any) => Promise<void>
  removeTrustedDevice: (deviceId: string) => Promise<void>
  getLoginSessions: () => Promise<void>
  revokeSession: (sessionId: string) => Promise<void>
  updatePrivacySettings: (settings: any) => Promise<void>
  reportSuspiciousActivity: (activity: any) => Promise<void>
  exportUserData: () => Promise<void>
  deleteAccount: (password: string) => Promise<void>
  checkPasswordStrength: (password: string) => number
  generateSecurePassword: () => string
}

export const useSecurityStore = create<SecurityStore>()(
  persist(
    (set, get) => ({
      twoFactorEnabled: false,
      trustedDevices: [],
      loginSessions: [],
      privacySettings: {
        profileVisibility: 'public',
        messagePermissions: 'everyone',
        showActivity: true,
        showFollowers: true,
        dataCollection: true,
        analyticsOptOut: false
      },
      securityAlerts: [],

      enableTwoFactor: async () => {
        try {
          const response = await fetch('/api/security/2fa/enable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          const { secret, qrCode } = await response.json()
          return qrCode
        } catch (error) {
          console.error('2FA enable error:', error)
          throw error
        }
      },

      verifyTwoFactor: async (code: string) => {
        try {
          const response = await fetch('/api/security/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          })
          const { valid } = await response.json()
          
          if (valid) {
            set({ twoFactorEnabled: true })
            toast.success('Two-factor authentication enabled!')
          }
          
          return valid
        } catch (error) {
          console.error('2FA verify error:', error)
          return false
        }
      },

      disableTwoFactor: async (code: string) => {
        try {
          const response = await fetch('/api/security/2fa/disable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          })
          
          if (response.ok) {
            set({ twoFactorEnabled: false })
            toast.success('Two-factor authentication disabled')
          }
        } catch (error) {
          console.error('2FA disable error:', error)
          toast.error('Failed to disable 2FA')
        }
      },

      addTrustedDevice: async (deviceInfo: any) => {
        try {
          const { data } = await supabase
            .from('trusted_devices')
            .insert({
              ...deviceInfo,
              created_at: new Date().toISOString()
            })
            .select()
            .single()

          set(state => ({
            trustedDevices: [...state.trustedDevices, data]
          }))
        } catch (error) {
          console.error('Add trusted device error:', error)
        }
      },

      removeTrustedDevice: async (deviceId: string) => {
        try {
          await supabase
            .from('trusted_devices')
            .delete()
            .eq('id', deviceId)

          set(state => ({
            trustedDevices: state.trustedDevices.filter(d => d.id !== deviceId)
          }))
        } catch (error) {
          console.error('Remove trusted device error:', error)
        }
      },

      getLoginSessions: async () => {
        try {
          const { data } = await supabase
            .from('login_sessions')
            .select('*')
            .order('created_at', { ascending: false })

          set({ loginSessions: data || [] })
        } catch (error) {
          console.error('Get sessions error:', error)
        }
      },

      revokeSession: async (sessionId: string) => {
        try {
          await supabase
            .from('login_sessions')
            .update({ revoked: true })
            .eq('id', sessionId)

          set(state => ({
            loginSessions: state.loginSessions.filter(s => s.id !== sessionId)
          }))
          
          toast.success('Session revoked')
        } catch (error) {
          console.error('Revoke session error:', error)
          toast.error('Failed to revoke session')
        }
      },

      updatePrivacySettings: async (settings: any) => {
        try {
          await supabase
            .from('user_privacy_settings')
            .upsert(settings)

          set({ privacySettings: settings })
          toast.success('Privacy settings updated')
        } catch (error) {
          console.error('Privacy settings error:', error)
          toast.error('Failed to update privacy settings')
        }
      },

      reportSuspiciousActivity: async (activity: any) => {
        try {
          await supabase
            .from('security_alerts')
            .insert({
              ...activity,
              reported_at: new Date().toISOString()
            })

          toast.success('Suspicious activity reported')
        } catch (error) {
          console.error('Report activity error:', error)
          toast.error('Failed to report activity')
        }
      },

      exportUserData: async () => {
        try {
          const response = await fetch('/api/security/export-data', {
            method: 'POST'
          })
          
          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'cirkel-data-export.zip'
            a.click()
            
            toast.success('Data export started')
          }
        } catch (error) {
          console.error('Export data error:', error)
          toast.error('Failed to export data')
        }
      },

      deleteAccount: async (password: string) => {
        try {
          const response = await fetch('/api/security/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
          })
          
          if (response.ok) {
            toast.success('Account deletion initiated')
            // Redirect to goodbye page
            window.location.href = '/goodbye'
          } else {
            toast.error('Invalid password')
          }
        } catch (error) {
          console.error('Delete account error:', error)
          toast.error('Failed to delete account')
        }
      },

      checkPasswordStrength: (password: string) => {
        let strength = 0
        
        if (password.length >= 8) strength += 20
        if (password.length >= 12) strength += 10
        if (/[a-z]/.test(password)) strength += 20
        if (/[A-Z]/.test(password)) strength += 20
        if (/\d/.test(password)) strength += 15
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15
        
        return Math.min(strength, 100)
      },

      generateSecurePassword: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        
        for (let i = 0; i < 16; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        
        return password
      }
    }),
    { name: 'cirkel-security' }
  )
)