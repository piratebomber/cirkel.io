'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthProvider'
import { toast } from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user && !user.isGuest) {
      // Initialize socket connection
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
        auth: {
          userId: user.id,
          username: user.username,
        },
        transports: ['websocket'],
      })

      socketInstance.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to socket server')
      })

      socketInstance.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from socket server')
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        toast.error('Connection error. Some features may not work properly.')
      })

      // Global event listeners
      socketInstance.on('notification', (data) => {
        toast.success(data.message, {
          duration: 5000,
        })
      })

      socketInstance.on('new_message', (data) => {
        // Handle new message notification
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${data.sender.displayName}`, {
            body: data.content,
            icon: data.sender.profilePicture || '/default-avatar.png',
          })
        }
      })

      socketInstance.on('new_follower', (data) => {
        toast.success(`${data.follower.displayName} started following you!`)
      })

      socketInstance.on('post_liked', (data) => {
        if (data.postAuthorId === user.id) {
          toast.success(`${data.liker.displayName} liked your post`)
        }
      })

      socketInstance.on('post_reposted', (data) => {
        if (data.postAuthorId === user.id) {
          toast.success(`${data.reposter.displayName} reposted your post`)
        }
      })

      socketInstance.on('post_commented', (data) => {
        if (data.postAuthorId === user.id) {
          toast.success(`${data.commenter.displayName} commented on your post`)
        }
      })

      socketInstance.on('mentioned', (data) => {
        toast.success(`${data.mentioner.displayName} mentioned you in a post`)
      })

      socketInstance.on('community_invite', (data) => {
        toast.success(`You've been invited to join ${data.community.displayName}`)
      })

      socketInstance.on('achievement_unlocked', (data) => {
        toast.success(`🎉 Achievement unlocked: ${data.achievement.name}!`, {
          duration: 6000,
        })
      })

      socketInstance.on('level_up', (data) => {
        toast.success(`🎊 Level up! You're now level ${data.newLevel}!`, {
          duration: 6000,
        })
      })

      socketInstance.on('trending_post', (data) => {
        if (data.authorId === user.id) {
          toast.success('🔥 Your post is trending!')
        }
      })

      socketInstance.on('verification_approved', () => {
        toast.success('🎉 Your verification has been approved!')
      })

      socketInstance.on('moderation_action', (data) => {
        toast.error(`Moderation action: ${data.action} - ${data.reason}`)
      })

      setSocket(socketInstance)

      return () => {
        socketInstance.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      // Disconnect socket if user logs out or is guest
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, user])

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket) {
      if (callback) {
        socket.off(event, callback)
      } else {
        socket.off(event)
      }
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}