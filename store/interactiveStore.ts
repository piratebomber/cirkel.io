import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface InteractiveStore {
  audioRooms: any[]
  activeRoom: any | null
  games: any[]
  events: any[]
  playlists: any[]
  calls: any[]
  
  // Audio Rooms
  createAudioRoom: (room: any) => Promise<string>
  joinAudioRoom: (roomId: string) => Promise<void>
  leaveAudioRoom: (roomId: string) => Promise<void>
  speakInRoom: (roomId: string) => Promise<void>
  
  // Games & Quizzes
  createGame: (game: any) => Promise<string>
  joinGame: (gameId: string) => Promise<void>
  submitAnswer: (gameId: string, answer: any) => Promise<void>
  
  // Virtual Events
  createEvent: (event: any) => Promise<string>
  joinEvent: (eventId: string) => Promise<void>
  
  // Collaborative Playlists
  createPlaylist: (playlist: any) => Promise<string>
  addToPlaylist: (playlistId: string, item: any) => Promise<void>
  
  // Voice/Video Calls
  startCall: (participants: string[], type: 'voice' | 'video') => Promise<string>
  joinCall: (callId: string) => Promise<void>
  endCall: (callId: string) => Promise<void>
  
  // Screen Sharing
  startScreenShare: (callId: string) => Promise<void>
  stopScreenShare: (callId: string) => Promise<void>
}

export const useInteractiveStore = create<InteractiveStore>((set, get) => ({
  audioRooms: [],
  activeRoom: null,
  games: [],
  events: [],
  playlists: [],
  calls: [],

  createAudioRoom: async (room: any) => {
    try {
      const { data } = await supabase
        .from('audio_rooms')
        .insert({
          ...room,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        audioRooms: [...state.audioRooms, data]
      }))

      toast.success('Audio room created!')
      return data.id
    } catch (error) {
      console.error('Create audio room error:', error)
      toast.error('Failed to create audio room')
      throw error
    }
  },

  joinAudioRoom: async (roomId: string) => {
    try {
      await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          joined_at: new Date().toISOString(),
          role: 'listener'
        })

      // Get room details
      const { data: room } = await supabase
        .from('audio_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      set({ activeRoom: room })
      toast.success('Joined audio room!')
    } catch (error) {
      console.error('Join audio room error:', error)
      toast.error('Failed to join audio room')
    }
  },

  leaveAudioRoom: async (roomId: string) => {
    try {
      await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)

      set({ activeRoom: null })
      toast.success('Left audio room')
    } catch (error) {
      console.error('Leave audio room error:', error)
    }
  },

  speakInRoom: async (roomId: string) => {
    try {
      await supabase
        .from('room_participants')
        .update({ role: 'speaker' })
        .eq('room_id', roomId)

      toast.success('You can now speak!')
    } catch (error) {
      console.error('Speak in room error:', error)
      toast.error('Failed to become speaker')
    }
  },

  createGame: async (game: any) => {
    try {
      const { data } = await supabase
        .from('games')
        .insert({
          ...game,
          status: 'waiting',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        games: [...state.games, data]
      }))

      toast.success('Game created!')
      return data.id
    } catch (error) {
      console.error('Create game error:', error)
      toast.error('Failed to create game')
      throw error
    }
  },

  joinGame: async (gameId: string) => {
    try {
      await supabase
        .from('game_participants')
        .insert({
          game_id: gameId,
          joined_at: new Date().toISOString()
        })

      toast.success('Joined game!')
    } catch (error) {
      console.error('Join game error:', error)
      toast.error('Failed to join game')
    }
  },

  submitAnswer: async (gameId: string, answer: any) => {
    try {
      await supabase
        .from('game_answers')
        .insert({
          game_id: gameId,
          answer,
          submitted_at: new Date().toISOString()
        })

      toast.success('Answer submitted!')
    } catch (error) {
      console.error('Submit answer error:', error)
      toast.error('Failed to submit answer')
    }
  },

  createEvent: async (event: any) => {
    try {
      const { data } = await supabase
        .from('virtual_events')
        .insert({
          ...event,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        events: [...state.events, data]
      }))

      toast.success('Event created!')
      return data.id
    } catch (error) {
      console.error('Create event error:', error)
      toast.error('Failed to create event')
      throw error
    }
  },

  joinEvent: async (eventId: string) => {
    try {
      await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          joined_at: new Date().toISOString()
        })

      toast.success('Joined event!')
    } catch (error) {
      console.error('Join event error:', error)
      toast.error('Failed to join event')
    }
  },

  createPlaylist: async (playlist: any) => {
    try {
      const { data } = await supabase
        .from('collaborative_playlists')
        .insert({
          ...playlist,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      set(state => ({
        playlists: [...state.playlists, data]
      }))

      toast.success('Playlist created!')
      return data.id
    } catch (error) {
      console.error('Create playlist error:', error)
      toast.error('Failed to create playlist')
      throw error
    }
  },

  addToPlaylist: async (playlistId: string, item: any) => {
    try {
      await supabase
        .from('playlist_items')
        .insert({
          playlist_id: playlistId,
          ...item,
          added_at: new Date().toISOString()
        })

      toast.success('Added to playlist!')
    } catch (error) {
      console.error('Add to playlist error:', error)
      toast.error('Failed to add to playlist')
    }
  },

  startCall: async (participants: string[], type: 'voice' | 'video') => {
    try {
      const { data } = await supabase
        .from('calls')
        .insert({
          participants,
          type,
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      // Initialize WebRTC connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      })

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      set(state => ({
        calls: [...state.calls, { ...data, peerConnection, stream }]
      }))

      toast.success('Call started!')
      return data.id
    } catch (error) {
      console.error('Start call error:', error)
      toast.error('Failed to start call')
      throw error
    }
  },

  joinCall: async (callId: string) => {
    try {
      await supabase
        .from('call_participants')
        .insert({
          call_id: callId,
          joined_at: new Date().toISOString()
        })

      toast.success('Joined call!')
    } catch (error) {
      console.error('Join call error:', error)
      toast.error('Failed to join call')
    }
  },

  endCall: async (callId: string) => {
    try {
      await supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', callId)

      // Clean up WebRTC connections
      set(state => ({
        calls: state.calls.filter(call => {
          if (call.id === callId) {
            call.peerConnection?.close()
            call.stream?.getTracks().forEach(track => track.stop())
            return false
          }
          return true
        })
      }))

      toast.success('Call ended')
    } catch (error) {
      console.error('End call error:', error)
      toast.error('Failed to end call')
    }
  },

  startScreenShare: async (callId: string) => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      })

      // Replace video track with screen share
      const call = get().calls.find(c => c.id === callId)
      if (call?.peerConnection) {
        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = call.peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        )
        
        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
      }

      toast.success('Screen sharing started!')
    } catch (error) {
      console.error('Screen share error:', error)
      toast.error('Failed to start screen sharing')
    }
  },

  stopScreenShare: async (callId: string) => {
    try {
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      const call = get().calls.find(c => c.id === callId)
      if (call?.peerConnection) {
        const videoTrack = cameraStream.getVideoTracks()[0]
        const sender = call.peerConnection.getSenders().find(s => 
          s.track?.kind === 'video'
        )
        
        if (sender) {
          await sender.replaceTrack(videoTrack)
        }
      }

      toast.success('Screen sharing stopped')
    } catch (error) {
      console.error('Stop screen share error:', error)
      toast.error('Failed to stop screen sharing')
    }
  }
}))