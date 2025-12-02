'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [eventTriggered, setEventTriggered] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user && !user.isGuest && !eventTriggered) {
      // Import and initialize event manager
      import('../../app/events/eventManager.js').then(({ default: EventManager }) => {
        const eventManager = new EventManager()
        
        // Trigger login event after a short delay
        setTimeout(async () => {
          const activeEvent = await eventManager.triggerLoginEvent()
          if (activeEvent) {
            setEventTriggered(true)
            
            // Store in sessionStorage to prevent multiple triggers
            sessionStorage.setItem('eventTriggered', 'true')
          }
        }, 1000)
      })
    }
  }, [isAuthenticated, user, eventTriggered])

  useEffect(() => {
    // Check if event was already triggered this session
    const wasTriggered = sessionStorage.getItem('eventTriggered')
    if (wasTriggered) {
      setEventTriggered(true)
    }
  }, [])

  return <>{children}</>
}