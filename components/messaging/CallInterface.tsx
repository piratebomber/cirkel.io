'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { VideoCall } from './VideoCall'
import { VoiceCall } from './VoiceCall'
import { IncomingCall } from './IncomingCall'
import { Button } from '@/components/ui/Button'
import { Phone, Video, PhoneOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CallInterfaceProps {
  conversationId: string
  participants: any[]
}

export function CallInterface({ conversationId, participants }: CallInterfaceProps) {
  const { user } = useAuth()
  const { socket, emit } = useSocket()
  const [callState, setCallState] = useState<{
    active: boolean
    type: 'voice' | 'video' | null
    incoming: boolean
    caller?: any
  }>({
    active: false,
    type: null,
    incoming: false
  })

  useEffect(() => {
    if (!socket) return

    // Listen for incoming calls
    socket.on('incoming-call', (data) => {
      if (data.conversationId === conversationId) {
        setCallState({
          active: true,
          type: data.type,
          incoming: true,
          caller: data.caller
        })
      }
    })

    // Listen for call accepted
    socket.on('call-accepted', (data) => {
      if (data.conversationId === conversationId) {
        setCallState(prev => ({
          ...prev,
          incoming: false
        }))
      }
    })

    // Listen for call rejected
    socket.on('call-rejected', () => {
      setCallState({
        active: false,
        type: null,
        incoming: false
      })
      toast.error('Call was declined')
    })

    // Listen for call ended
    socket.on('call-ended', () => {
      setCallState({
        active: false,
        type: null,
        incoming: false
      })
    })

    return () => {
      socket.off('incoming-call')
      socket.off('call-accepted')
      socket.off('call-rejected')
      socket.off('call-ended')
    }
  }, [socket, conversationId])

  const startCall = async (type: 'voice' | 'video') => {
    try {
      // Check permissions first
      const constraints = {
        audio: true,
        video: type === 'video'
      }

      await navigator.mediaDevices.getUserMedia(constraints)

      // Emit call initiation
      emit('initiate-call', {
        conversationId,
        type,
        caller: {
          id: user?.id,
          displayName: user?.displayName,
          profilePicture: user?.profilePicture
        }
      })

      setCallState({
        active: true,
        type,
        incoming: false
      })

      toast.success(`${type === 'video' ? 'Video' : 'Voice'} call started`)
    } catch (error) {
      console.error('Error starting call:', error)
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('Camera/microphone permission denied')
        } else if (error.name === 'NotFoundError') {
          toast.error('No camera/microphone found')
        } else {
          toast.error('Failed to start call')
        }
      }
    }
  }

  const acceptCall = () => {
    emit('accept-call', { conversationId })
    setCallState(prev => ({
      ...prev,
      incoming: false
    }))
  }

  const rejectCall = () => {
    emit('reject-call', { conversationId })
    setCallState({
      active: false,
      type: null,
      incoming: false
    })
  }

  const endCall = () => {
    emit('end-call', { conversationId })
    setCallState({
      active: false,
      type: null,
      incoming: false
    })
  }

  // Show incoming call interface
  if (callState.incoming) {
    return (
      <IncomingCall
        caller={callState.caller}
        type={callState.type!}
        onAccept={acceptCall}
        onReject={rejectCall}
      />
    )
  }

  // Show active call interface
  if (callState.active && !callState.incoming) {
    if (callState.type === 'video') {
      return (
        <VideoCall
          conversationId={conversationId}
          participants={participants}
          onEndCall={endCall}
        />
      )
    } else if (callState.type === 'voice') {
      return (
        <VoiceCall
          conversationId={conversationId}
          participants={participants}
          onEndCall={endCall}
        />
      )
    }
  }

  // Show call initiation buttons
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => startCall('voice')}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Phone className="w-4 h-4" />
        Voice Call
      </Button>
      
      <Button
        onClick={() => startCall('video')}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Video className="w-4 h-4" />
        Video Call
      </Button>
    </div>
  )
}