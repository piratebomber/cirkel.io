'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Phone, PhoneOff, Video, Mic } from 'lucide-react'

interface IncomingCallProps {
  caller: {
    id: string
    displayName: string
    profilePicture?: string
  }
  type: 'voice' | 'video'
  onAccept: () => void
  onReject: () => void
}

export function IncomingCall({ caller, type, onAccept, onReject }: IncomingCallProps) {
  const [isRinging, setIsRinging] = useState(true)
  const [ringTone, setRingTone] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create programmatic ringtone
    const createRingtone = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const createTone = (frequency: number, duration: number, startTime: number) => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, startTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }
      
      const playRingtone = () => {
        const now = audioContext.currentTime
        createTone(523.25, 0.5, now) // C5
        createTone(659.25, 0.5, now + 0.6) // E5
        createTone(783.99, 0.5, now + 1.2) // G5
        createTone(1046.50, 0.8, now + 1.8) // C6
      }
      
      return { playRingtone, audioContext }
    }
    
    const { playRingtone, audioContext } = createRingtone()
    
    // Play ringtone in loop
    const ringtoneInterval = setInterval(() => {
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      playRingtone()
    }, 3000)
    
    // Initial play
    playRingtone()

    // Vibrate if supported
    if ('vibrate' in navigator) {
      const vibratePattern = [200, 100, 200, 100, 200]
      const vibrateInterval = setInterval(() => {
        navigator.vibrate(vibratePattern)
      }, 1000)

      return () => {
        clearInterval(vibrateInterval)
        navigator.vibrate(0) // Stop vibration
      }
    }

    return () => {
      clearInterval(ringtoneInterval)
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  const handleAccept = () => {
    setIsRinging(false)
    onAccept()
  }

  const handleReject = () => {
    setIsRinging(false)
    onReject()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cirkel-500/20 to-cirkel-700/20">
        <div className={`absolute inset-0 ${isRinging ? 'animate-pulse' : ''}`}>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cirkel-500/10 rounded-full animate-ping" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cirkel-400/10 rounded-full animate-ping animation-delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-cirkel-600/10 rounded-full animate-ping animation-delay-2000" />
        </div>
      </div>

      {/* Call content */}
      <div className="relative z-10 text-center">
        {/* Incoming call indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 text-sm opacity-80 mb-2">
            {type === 'video' ? <Video className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            Incoming {type} call
          </div>
        </div>

        {/* Caller avatar with ring animation */}
        <div className="relative mb-6">
          <div className={`absolute inset-0 rounded-full border-4 border-white/30 ${isRinging ? 'animate-ping' : ''}`} />
          <div className={`absolute inset-2 rounded-full border-2 border-white/20 ${isRinging ? 'animate-ping animation-delay-500' : ''}`} />
          <Avatar
            src={caller.profilePicture}
            alt={caller.displayName}
            size="xl"
            className="w-40 h-40 border-4 border-white/50 relative z-10"
          />
        </div>

        {/* Caller info */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{caller.displayName}</h2>
          <p className="text-lg opacity-80">
            {type === 'video' ? 'Video Call' : 'Voice Call'}
          </p>
        </div>

        {/* Call actions */}
        <div className="flex items-center justify-center gap-8">
          {/* Reject call */}
          <div className="text-center">
            <Button
              onClick={handleReject}
              variant="destructive"
              size="lg"
              className="rounded-full w-20 h-20 p-0 bg-red-600 hover:bg-red-700 border-2 border-red-400 mb-2"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>
            <p className="text-sm opacity-60">Decline</p>
          </div>

          {/* Accept call */}
          <div className="text-center">
            <Button
              onClick={handleAccept}
              variant="secondary"
              size="lg"
              className="rounded-full w-20 h-20 p-0 bg-green-600 hover:bg-green-700 border-2 border-green-400 mb-2"
            >
              <Phone className="w-8 h-8" />
            </Button>
            <p className="text-sm opacity-60">Accept</p>
          </div>
        </div>

        {/* Quick actions for video calls */}
        {type === 'video' && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={handleAccept}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Mic className="w-4 h-4 mr-2" />
              Audio Only
            </Button>
          </div>
        )}
      </div>

      {/* Swipe indicators for mobile */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center gap-4 text-sm opacity-60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center">
              <PhoneOff className="w-4 h-4" />
            </div>
            Swipe left to decline
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600/20 rounded-full flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            Swipe right to accept
          </div>
        </div>
      </div>
    </div>
  )
}