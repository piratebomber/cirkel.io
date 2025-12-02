export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private onRemoteStream?: (stream: MediaStream) => void
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void

  constructor() {
    this.initializePeerConnection()
  }

  private initializePeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    this.peerConnection.ontrack = (event) => {
      const [stream] = event.streams
      this.remoteStream = stream
      this.onRemoteStream?.(stream)
    }

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        this.onConnectionStateChange?.(this.peerConnection.connectionState)
      }
    }
  }

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    try {
      // High-quality constraints
      const enhancedConstraints: MediaStreamConstraints = {
        audio: constraints.audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
          ...constraints.audio
        } : false,
        video: constraints.video ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
          ...constraints.video
        } : false
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(enhancedConstraints)
      
      // Add tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!)
        })
      }

      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  async getDisplayMedia(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      return screenStream
    } catch (error) {
      console.error('Error accessing screen share:', error)
      throw error
    }
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    })

    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.setRemoteDescription(description)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    await this.peerConnection.addIceCandidate(candidate)
  }

  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    const sender = this.peerConnection.getSenders().find(s => 
      s.track?.kind === 'video'
    )

    if (sender) {
      await sender.replaceTrack(newTrack)
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = enabled
      }
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = enabled
      }
    }
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  onRemoteStreamReceived(callback: (stream: MediaStream) => void): void {
    this.onRemoteStream = callback
  }

  onConnectionStateChanged(callback: (state: RTCPeerConnectionState) => void): void {
    this.onConnectionStateChange = callback
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          callback(event.candidate)
        }
      }
    }
  }

  getStats(): Promise<RTCStatsReport> | null {
    return this.peerConnection?.getStats() || null
  }

  close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    this.remoteStream = null
  }
}

export const createWebRTCManager = () => new WebRTCManager()

// Audio quality optimization
export const getOptimizedAudioConstraints = (): MediaTrackConstraints => ({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: { ideal: 48000 },
  channelCount: { ideal: 2 },
  latency: { ideal: 0.01 },
  volume: { ideal: 1.0 }
})

// Video quality optimization
export const getOptimizedVideoConstraints = (quality: 'low' | 'medium' | 'high' | 'ultra' = 'high'): MediaTrackConstraints => {
  const constraints = {
    low: {
      width: { ideal: 640, max: 854 },
      height: { ideal: 480, max: 480 },
      frameRate: { ideal: 15, max: 24 }
    },
    medium: {
      width: { ideal: 854, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 }
    },
    high: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 }
    },
    ultra: {
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      frameRate: { ideal: 30, max: 60 }
    }
  }

  return {
    ...constraints[quality],
    facingMode: 'user',
    aspectRatio: { ideal: 16/9 }
  }
}