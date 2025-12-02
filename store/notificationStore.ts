import { create } from 'zustand'
import { Notification, NotificationType } from '@/types'
import { supabase, getUserNotifications, markNotificationAsRead, createNotification } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  hasMore: boolean
  page: number

  // Actions
  fetchNotifications: (userId: string, reset?: boolean) => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAll: (userId: string) => Promise<void>
  
  // Real-time updates
  addNotification: (notification: Notification) => void
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void
  removeNotification: (notificationId: string) => void
  
  // Filters
  filterByType: (type: NotificationType) => Notification[]
  getUnreadNotifications: () => Notification[]
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  page: 0,

  fetchNotifications: async (userId: string, reset = false) => {
    const { isLoading, page } = get()
    if (isLoading) return

    set({ isLoading: true })

    try {
      const currentPage = reset ? 0 : page
      const data = await getUserNotifications(userId, currentPage, 20)

      set(state => ({
        notifications: reset ? data : [...state.notifications, ...data],
        hasMore: data.length === 20,
        page: currentPage + 1,
        unreadCount: reset ? data.filter(n => !n.isRead).length : state.unreadCount,
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
      set({ isLoading: false })
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      
      set(state => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  },

  markAllAsRead: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))

      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const newNotification = await createNotification({
        ...notification,
        created_at: new Date().toISOString(),
      })

      // Don't add to local state if it's for the current user (will be added via real-time)
      toast.success('Notification sent')
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error('Failed to send notification')
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId)
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.isRead 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
        }
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  },

  clearAll: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      set({
        notifications: [],
        unreadCount: 0,
      })

      toast.success('All notifications cleared')
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }))
  },

  updateNotification: (notificationId: string, updates: Partial<Notification>) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, ...updates } : n
      ),
    }))
  },

  removeNotification: (notificationId: string) => {
    set(state => {
      const notification = state.notifications.find(n => n.id === notificationId)
      return {
        notifications: state.notifications.filter(n => n.id !== notificationId),
        unreadCount: notification && !notification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      }
    })
  },

  filterByType: (type: NotificationType) => {
    return get().notifications.filter(n => n.type === type)
  },

  getUnreadNotifications: () => {
    return get().notifications.filter(n => !n.isRead)
  },
}))

// Real-time subscription helper
export const subscribeToNotifications = (userId: string) => {
  const { addNotification, updateNotification, removeNotification } = useNotificationStore.getState()

  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      addNotification(payload.new as Notification)
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      updateNotification(payload.new.id, payload.new as Partial<Notification>)
    })
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      removeNotification(payload.old.id)
    })
    .subscribe()
}