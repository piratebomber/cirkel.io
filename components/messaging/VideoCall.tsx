'use client'

import { useEffect, useRef, useState } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
import { Button } from '@/components/ui/Button'
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor,
  MonitorOff,
  Volume2,
  VolumeX
} from 'lucide-react'

interface VideoCallProps {
  conversationId: string
  participants: any[]
  onEndCall: () => void
}

export function VideoCall({ conversationId, participants, onEndCall }: VideoCallProps) {
  const { socket, emit } = useSocket()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')

  useEffect(() => {
    initializeCall()
    setupSocketListeners()
    
    return () => {
      cleanup()
    }
  }, [])

  const initializeCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      })

      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        setCallStatus('connected')
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          emit('ice-candidate', {
            conversationId,
            candidate: event.candidate
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'connected') {
          setCallStatus('connected')
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed') {
          setCallStatus('ended')
        }
      }

      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      })
      
      await peerConnection.setLocalDescription(offer)
      
      emit('call-offer', {
        conversationId,
        offer: offer
      })

    } catch (error) {
      console.error('Error initializing call:', error)
      setCallStatus('ended')
    }
  }

  const setupSocketListeners = () => {
    if (!socket) return

    socket.on('call-offer', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.offer)
        
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        
        emit('call-answer', {
          conversationId,
          answer: answer
        })
      }
    })

    socket.on('call-answer', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.answer)
      }
    })

    socket.on('ice-candidate', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate)
      }
    })

    socket.on('call-ended', () => {
      setCallStatus('ended')
      cleanup()
    })
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return

    try {
      if (isScreenSharing) {
        // Stop screen sharing, return to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })

        const videoTrack = stream.getVideoTracks()[0]
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track?.kind === 'video'
        )

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }

        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        setIsScreenSharing(false)
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: true
        })

        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track?.kind === 'video'
        )

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack)
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream
        }

        // Handle screen share end
        videoTrack.onended = () => {
          toggleScreenShare()
        }

        setIsScreenSharing(true)
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
    }
  }

  const toggleMute = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted
      setIsMuted(remoteVideoRef.current.muted)
    }
  }

  const endCall = () => {
    emit('call-ended', { conversationId })
    cleanup()
    onEndCall()
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    
    setCallStatus('ended')
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Call Status */}
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && 'Connected'}
          {callStatus === 'ended' && 'Call Ended'}
        </div>

        {/* Participant Info */}
        <div className="absolute bottom-20 left-4 text-white">
          <h3 className="text-lg font-semibold">
            {participants.find(p => p.id !== 'current-user')?.displayName || 'Unknown'}
          </h3>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-4">
        <div className="flex justify-center items-center gap-4">
          {/* Mute Audio */}
          <Button
            onClick={toggleAudio}
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>

          {/* Toggle Video */}
          <Button
            onClick={toggleVideo}
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          {/* Screen Share */}
          <Button
            onClick={toggleScreenShare}
            variant={isScreenSharing ? "primary" : "secondary"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          {/* Mute Remote */}
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full w-12 h-12 p-0"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {/* End Call */}
          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14 p-0 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}