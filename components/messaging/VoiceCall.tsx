'use client'

import { useEffect, useRef, useState } from 'react'
import { useSocket } from '@/components/providers/SocketProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2,
  VolumeX,
  Speaker,
  SpeakerX
} from 'lucide-react'

interface VoiceCallProps {
  conversationId: string
  participants: any[]
  onEndCall: () => void
}

export function VoiceCall({ conversationId, participants, onEndCall }: VoiceCallProps) {
  const { socket, emit } = useSocket()
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting')
  const [audioLevel, setAudioLevel] = useState(0)

  useEffect(() => {
    initializeVoiceCall()
    setupSocketListeners()
    
    const timer = setInterval(() => {
      if (callStatus === 'connected') {
        setCallDuration(prev => prev + 1)
      }
    }, 1000)
    
    return () => {
      cleanup()
      clearInterval(timer)
    }
  }, [])

  const initializeVoiceCall = async () => {
    try {
      // Get high-quality audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      })

      localStreamRef.current = stream
      
      // Setup audio level monitoring
      setupAudioLevelMonitoring(stream)

      // Create peer connection with optimized settings
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      })

      peerConnectionRef.current = peerConnection

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream
        }
        setCallStatus('connected')
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          emit('voice-ice-candidate', {
            conversationId,
            candidate: event.candidate
          })
        }
      }

      // Handle connection state
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
        offerToReceiveVideo: false
      })
      
      await peerConnection.setLocalDescription(offer)
      
      emit('voice-call-offer', {
        conversationId,
        offer: offer
      })

    } catch (error) {
      console.error('Error initializing voice call:', error)
      setCallStatus('ended')
    }
  }

  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    
    analyser.fftSize = 256
    microphone.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average)
      requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  const setupSocketListeners = () => {
    if (!socket) return

    socket.on('voice-call-offer', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.offer)
        
        const answer = await peerConnectionRef.current.createAnswer()
        await peerConnectionRef.current.setLocalDescription(answer)
        
        emit('voice-call-answer', {
          conversationId,
          answer: answer
        })
      }
    })

    socket.on('voice-call-answer', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(data.answer)
      }
    })

    socket.on('voice-ice-candidate', async (data) => {
      if (data.conversationId === conversationId && peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(data.candidate)
      }
    })

    socket.on('voice-call-ended', () => {
      setCallStatus('ended')
      cleanup()
    })
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

  const toggleMute = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted
      setIsMuted(remoteAudioRef.current.muted)
    }
  }

  const toggleSpeaker = async () => {
    if (remoteAudioRef.current && 'setSinkId' in remoteAudioRef.current) {
      try {
        if (isSpeakerOn) {
          // Switch to earpiece/headphones
          await (remoteAudioRef.current as any).setSinkId('default')
        } else {
          // Switch to speaker
          const devices = await navigator.mediaDevices.enumerateDevices()
          const speakers = devices.filter(device => device.kind === 'audiooutput')
          if (speakers.length > 1) {
            await (remoteAudioRef.current as any).setSinkId(speakers[1].deviceId)
          }
        }
        setIsSpeakerOn(!isSpeakerOn)
      } catch (error) {
        console.error('Error switching audio output:', error)
      }
    }
  }

  const endCall = () => {
    emit('voice-call-ended', { conversationId })
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const otherParticipant = participants.find(p => p.id !== 'current-user')

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-cirkel-500 to-cirkel-700 z-50 flex flex-col items-center justify-center text-white">
      {/* Hidden audio elements */}
      <audio ref={localAudioRef} autoPlay muted />
      <audio ref={remoteAudioRef} autoPlay />

      {/* Call Info */}
      <div className="text-center mb-8">
        <div className="relative mb-4">
          <Avatar
            src={otherParticipant?.profilePicture}
            alt={otherParticipant?.displayName || 'Unknown'}
            size="xl"
            className="w-32 h-32 border-4 border-white/20"
          />
          
          {/* Audio level indicator */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 bg-white rounded-full transition-all duration-150 ${
                    audioLevel > i * 50 ? 'h-4 opacity-100' : 'h-2 opacity-30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          {otherParticipant?.displayName || 'Unknown User'}
        </h2>
        
        <div className="text-lg opacity-80">
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && formatDuration(callDuration)}
          {callStatus === 'ended' && 'Call Ended'}
        </div>
      </div>

      {/* Call Quality Indicator */}
      {callStatus === 'connected' && (
        <div className="mb-8 flex items-center gap-2 text-sm opacity-80">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          HD Audio Quality
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6">
        {/* Mute/Unmute */}
        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? "secondary" : "destructive"}
          size="lg"
          className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 border-2 border-white/30"
        >
          {isAudioEnabled ? (
            <Mic className="w-6 h-6 text-white" />
          ) : (
            <MicOff className="w-6 h-6 text-white" />
          )}
        </Button>

        {/* Speaker Toggle */}
        <Button
          onClick={toggleSpeaker}
          variant={isSpeakerOn ? "primary" : "secondary"}
          size="lg"
          className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 border-2 border-white/30"
        >
          {isSpeakerOn ? (
            <Speaker className="w-6 h-6 text-white" />
          ) : (
            <SpeakerX className="w-6 h-6 text-white" />
          )}
        </Button>

        {/* End Call */}
        <Button
          onClick={endCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-20 h-20 p-0 bg-red-600 hover:bg-red-700 border-2 border-red-400"
        >
          <PhoneOff className="w-8 h-8" />
        </Button>

        {/* Mute Remote */}
        <Button
          onClick={toggleMute}
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full w-16 h-16 p-0 bg-white/20 hover:bg-white/30 border-2 border-white/30"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </Button>
      </div>

      {/* Call Status */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm opacity-60">
          {callStatus === 'connecting' && 'Establishing secure connection...'}
          {callStatus === 'connected' && 'End-to-end encrypted'}
          {callStatus === 'ended' && 'Call disconnected'}
        </p>
      </div>
    </div>
  )
}