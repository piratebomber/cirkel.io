import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MobileStore {
  isOffline: boolean
  syncQueue: any[]
  pushToken: string | null
  cameraPermission: boolean
  locationPermission: boolean
  biometricEnabled: boolean
  
  // Actions
  setOfflineMode: (offline: boolean) => void
  addToSyncQueue: (action: any) => void
  processSyncQueue: () => Promise<void>
  requestPushPermission: () => Promise<string | null>
  requestCameraPermission: () => Promise<boolean>
  requestLocationPermission: () => Promise<boolean>
  enableBiometric: () => Promise<boolean>
  capturePhoto: () => Promise<string>
  getCurrentLocation: () => Promise<any>
  scheduleNotification: (notification: any) => void
  createAppShortcut: (shortcut: any) => void
}

export const useMobileStore = create<MobileStore>()(
  persist(
    (set, get) => ({
      isOffline: false,
      syncQueue: [],
      pushToken: null,
      cameraPermission: false,
      locationPermission: false,
      biometricEnabled: false,

      setOfflineMode: (offline: boolean) => {
        set({ isOffline: offline })
        
        if (!offline) {
          // Process sync queue when coming back online
          get().processSyncQueue()
        }
      },

      addToSyncQueue: (action: any) => {
        set(state => ({
          syncQueue: [...state.syncQueue, {
            ...action,
            timestamp: Date.now(),
            id: Math.random().toString(36)
          }]
        }))
      },

      processSyncQueue: async () => {
        const { syncQueue } = get()
        
        for (const action of syncQueue) {
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action)
            })
            
            // Remove from queue on success
            set(state => ({
              syncQueue: state.syncQueue.filter(item => item.id !== action.id)
            }))
          } catch (error) {
            console.error('Sync error:', error)
            // Keep in queue for retry
          }
        }
      },

      requestPushPermission: async () => {
        try {
          if ('Notification' in window) {
            const permission = await Notification.requestPermission()
            
            if (permission === 'granted') {
              // Get FCM token
              const { getMessaging, getToken } = await import('firebase/messaging')
              const messaging = getMessaging()
              const token = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
              })
              
              set({ pushToken: token })
              return token
            }
          }
          return null
        } catch (error) {
          console.error('Push permission error:', error)
          return null
        }
      },

      requestCameraPermission: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          set({ cameraPermission: true })
          return true
        } catch (error) {
          console.error('Camera permission error:', error)
          set({ cameraPermission: false })
          return false
        }
      },

      requestLocationPermission: async () => {
        try {
          await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          set({ locationPermission: true })
          return true
        } catch (error) {
          console.error('Location permission error:', error)
          set({ locationPermission: false })
          return false
        }
      },

      enableBiometric: async () => {
        try {
          if ('credentials' in navigator) {
            const credential = await navigator.credentials.create({
              publicKey: {
                challenge: new Uint8Array(32),
                rp: { name: 'Cirkel.io' },
                user: {
                  id: new Uint8Array(16),
                  name: 'user@cirkel.io',
                  displayName: 'Cirkel User'
                },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                authenticatorSelection: {
                  authenticatorAttachment: 'platform',
                  userVerification: 'required'
                }
              }
            })
            
            if (credential) {
              set({ biometricEnabled: true })
              return true
            }
          }
          return false
        } catch (error) {
          console.error('Biometric error:', error)
          return false
        }
      },

      capturePhoto: async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          const video = document.createElement('video')
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          video.srcObject = stream
          await video.play()
          
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx?.drawImage(video, 0, 0)
          
          stream.getTracks().forEach(track => track.stop())
          
          return canvas.toDataURL('image/jpeg')
        } catch (error) {
          console.error('Photo capture error:', error)
          throw error
        }
      },

      getCurrentLocation: async () => {
        try {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              position => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              }),
              reject,
              { enableHighAccuracy: true, timeout: 10000 }
            )
          })
        } catch (error) {
          console.error('Location error:', error)
          throw error
        }
      },

      scheduleNotification: (notification: any) => {
        if ('serviceWorker' in navigator && 'Notification' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(notification.title, {
              body: notification.body,
              icon: notification.icon || '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: notification.tag,
              data: notification.data,
              actions: notification.actions || []
            })
          })
        }
      },

      createAppShortcut: (shortcut: any) => {
        if ('shortcuts' in navigator) {
          (navigator as any).shortcuts.add({
            name: shortcut.name,
            description: shortcut.description,
            url: shortcut.url,
            icons: shortcut.icons
          })
        }
      }
    }),
    { name: 'cirkel-mobile' }
  )
)

// Service Worker registration
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('SW registered:', registration)
    })
    .catch(error => {
      console.log('SW registration failed:', error)
    })
}

// Network status monitoring
if (typeof window !== 'undefined') {
  const updateOnlineStatus = () => {
    useMobileStore.getState().setOfflineMode(!navigator.onLine)
  }
  
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
}