import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';
import { Server as SocketIOServer } from 'socket.io';

export interface VoiceRoom {
  id: string;
  title: string;
  description: string;
  hostId: string;
  category: string;
  isPrivate: boolean;
  maxParticipants: number;
  currentParticipants: number;
  status: 'waiting' | 'live' | 'ended';
  scheduledFor?: string;
  createdAt: string;
  settings: {
    allowRecording: boolean;
    moderationEnabled: boolean;
    handRaiseEnabled: boolean;
    chatEnabled: boolean;
    backgroundMusic: boolean;
  };
}

export interface Participant {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: 'host' | 'speaker' | 'listener';
  isMuted: boolean;
  isHandRaised: boolean;
  joinedAt: string;
  speakingTime: number;
}

export class VoiceRoomService extends EventEmitter {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private activeRooms = new Map<string, VoiceRoom>();
  private roomParticipants = new Map<string, Map<string, Participant>>();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    super();
    this.io = io;
    this.setupSocketHandlers();
  }

  async createRoom(
    hostId: string,
    roomData: {
      title: string;
      description: string;
      category: string;
      isPrivate: boolean;
      maxParticipants: number;
      scheduledFor?: string;
      settings: VoiceRoom['settings'];
    }
  ): Promise<string> {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const room: VoiceRoom = {
      id: roomId,
      hostId,
      currentParticipants: 0,
      status: roomData.scheduledFor ? 'waiting' : 'live',
      createdAt: new Date().toISOString(),
      ...roomData
    };

    const { data } = await this.supabase
      .from('voice_rooms')
      .insert({
        id: roomId,
        host_id: hostId,
        title: roomData.title,
        description: roomData.description,
        category: roomData.category,
        is_private: roomData.isPrivate,
        max_participants: roomData.maxParticipants,
        scheduled_for: roomData.scheduledFor,
        settings: roomData.settings,
        status: room.status,
        created_at: room.createdAt
      })
      .select()
      .single();

    this.activeRooms.set(roomId, room);
    this.roomParticipants.set(roomId, new Map());

    // Auto-join host
    await this.joinRoom(roomId, hostId, 'host');

    this.emit('roomCreated', { room });
    return roomId;
  }

  async joinRoom(roomId: string, userId: string, requestedRole: 'speaker' | 'listener' = 'listener'): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room) return false;

    if (room.currentParticipants >= room.maxParticipants) {
      return false;
    }

    const { data: user } = await this.supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', userId)
      .single();

    if (!user) return false;

    const participants = this.roomParticipants.get(roomId)!;
    const role = userId === room.hostId ? 'host' : requestedRole;

    const participant: Participant = {
      userId,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role,
      isMuted: role === 'listener',
      isHandRaised: false,
      joinedAt: new Date().toISOString(),
      speakingTime: 0
    };

    participants.set(userId, participant);
    room.currentParticipants = participants.size;

    // Log participation
    await this.supabase
      .from('voice_room_participants')
      .insert({
        room_id: roomId,
        user_id: userId,
        role,
        joined_at: participant.joinedAt
      });

    // Notify room
    this.io.to(roomId).emit('participantJoined', { participant, roomId });
    this.emit('participantJoined', { roomId, participant });

    return true;
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const participants = this.roomParticipants.get(roomId);
    if (!participants || !participants.has(userId)) return;

    const participant = participants.get(userId)!;
    participants.delete(userId);

    const room = this.activeRooms.get(roomId);
    if (room) {
      room.currentParticipants = participants.size;
    }

    // Update database
    await this.supabase
      .from('voice_room_participants')
      .update({ 
        left_at: new Date().toISOString(),
        speaking_time: participant.speakingTime
      })
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .is('left_at', null);

    // If host leaves, end room or transfer host
    if (participant.role === 'host') {
      const speakers = Array.from(participants.values()).filter(p => p.role === 'speaker');
      if (speakers.length > 0) {
        await this.transferHost(roomId, speakers[0].userId);
      } else {
        await this.endRoom(roomId);
      }
    }

    this.io.to(roomId).emit('participantLeft', { userId, roomId });
    this.emit('participantLeft', { roomId, userId });
  }

  async promoteToSpeaker(roomId: string, hostId: string, userId: string): Promise<boolean> {
    const room = this.activeRooms.get(roomId);
    const participants = this.roomParticipants.get(roomId);
    
    if (!room || !participants || room.hostId !== hostId) return false;

    const participant = participants.get(userId);
    if (!participant || participant.role !== 'listener') return false;

    participant.role = 'speaker';
    participant.isMuted = false;

    await this.supabase
      .from('voice_room_participants')
      .update({ role: 'speaker' })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    this.io.to(roomId).emit('participantPromoted', { userId, roomId });
    return true;
  }

  async demoteToListener(roomId: string, hostId: string, userId: string): Promise<boolean> {
    const room = this.activeRooms.get(roomId);
    const participants = this.roomParticipants.get(roomId);
    
    if (!room || !participants || room.hostId !== hostId) return false;

    const participant = participants.get(userId);
    if (!participant || participant.role !== 'speaker') return false;

    participant.role = 'listener';
    participant.isMuted = true;
    participant.isHandRaised = false;

    await this.supabase
      .from('voice_room_participants')
      .update({ role: 'listener' })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    this.io.to(roomId).emit('participantDemoted', { userId, roomId });
    return true;
  }

  async raiseHand(roomId: string, userId: string): Promise<void> {
    const participants = this.roomParticipants.get(roomId);
    const participant = participants?.get(userId);
    
    if (participant && participant.role === 'listener') {
      participant.isHandRaised = !participant.isHandRaised;
      
      this.io.to(roomId).emit('handRaised', { 
        userId, 
        roomId, 
        isRaised: participant.isHandRaised 
      });
    }
  }

  async muteParticipant(roomId: string, hostId: string, userId: string): Promise<boolean> {
    const room = this.activeRooms.get(roomId);
    const participants = this.roomParticipants.get(roomId);
    
    if (!room || !participants || room.hostId !== hostId) return false;

    const participant = participants.get(userId);
    if (!participant) return false;

    participant.isMuted = true;
    
    this.io.to(roomId).emit('participantMuted', { userId, roomId });
    return true;
  }

  async endRoom(roomId: string): Promise<void> {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    room.status = 'ended';

    await this.supabase
      .from('voice_rooms')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', roomId);

    // Notify all participants
    this.io.to(roomId).emit('roomEnded', { roomId });
    
    // Clean up
    this.activeRooms.delete(roomId);
    this.roomParticipants.delete(roomId);

    this.emit('roomEnded', { roomId });
  }

  async getActiveRooms(category?: string, limit: number = 20): Promise<VoiceRoom[]> {
    let query = this.supabase
      .from('voice_rooms')
      .select(`
        *,
        users!host_id(username, display_name, avatar_url, verified)
      `)
      .eq('status', 'live')
      .eq('is_private', false);

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query
      .order('current_participants', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getRoomParticipants(roomId: string): Promise<Participant[]> {
    const participants = this.roomParticipants.get(roomId);
    return participants ? Array.from(participants.values()) : [];
  }

  async getRoomAnalytics(roomId: string): Promise<any> {
    const [room, participants, interactions] = await Promise.all([
      this.supabase
        .from('voice_rooms')
        .select('*')
        .eq('id', roomId)
        .single(),
      
      this.supabase
        .from('voice_room_participants')
        .select('*')
        .eq('room_id', roomId),
      
      this.supabase
        .from('voice_room_interactions')
        .select('*')
        .eq('room_id', roomId)
    ]);

    const totalParticipants = participants.data?.length || 0;
    const avgSpeakingTime = participants.data?.reduce((sum, p) => sum + (p.speaking_time || 0), 0) / totalParticipants || 0;
    const peakParticipants = Math.max(...(participants.data?.map(p => p.peak_participants) || [0]));

    return {
      room: room.data,
      totalParticipants,
      avgSpeakingTime,
      peakParticipants,
      interactions: interactions.data?.length || 0,
      duration: room.data?.ended_at ? 
        new Date(room.data.ended_at).getTime() - new Date(room.data.created_at).getTime() : 
        Date.now() - new Date(room.data?.created_at || 0).getTime()
    };
  }

  async scheduleRoom(
    hostId: string,
    roomData: Omit<VoiceRoom, 'id' | 'hostId' | 'currentParticipants' | 'status' | 'createdAt'>,
    scheduledFor: string
  ): Promise<string> {
    return this.createRoom(hostId, { ...roomData, scheduledFor });
  }

  async startScheduledRoom(roomId: string): Promise<boolean> {
    const room = this.activeRooms.get(roomId);
    if (!room || room.status !== 'waiting') return false;

    room.status = 'live';
    
    await this.supabase
      .from('voice_rooms')
      .update({ 
        status: 'live',
        started_at: new Date().toISOString()
      })
      .eq('id', roomId);

    this.emit('roomStarted', { roomId });
    return true;
  }

  private async getRoom(roomId: string): Promise<VoiceRoom | null> {
    if (this.activeRooms.has(roomId)) {
      return this.activeRooms.get(roomId)!;
    }

    const { data } = await this.supabase
      .from('voice_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (data) {
      const room: VoiceRoom = {
        id: data.id,
        title: data.title,
        description: data.description,
        hostId: data.host_id,
        category: data.category,
        isPrivate: data.is_private,
        maxParticipants: data.max_participants,
        currentParticipants: data.current_participants || 0,
        status: data.status,
        scheduledFor: data.scheduled_for,
        createdAt: data.created_at,
        settings: data.settings
      };

      this.activeRooms.set(roomId, room);
      return room;
    }

    return null;
  }

  private async transferHost(roomId: string, newHostId: string): Promise<void> {
    const room = this.activeRooms.get(roomId);
    const participants = this.roomParticipants.get(roomId);
    
    if (!room || !participants) return;

    const newHost = participants.get(newHostId);
    if (!newHost) return;

    room.hostId = newHostId;
    newHost.role = 'host';

    await this.supabase
      .from('voice_rooms')
      .update({ host_id: newHostId })
      .eq('id', roomId);

    this.io.to(roomId).emit('hostTransferred', { roomId, newHostId });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('joinVoiceRoom', async (data) => {
        const { roomId, userId, role } = data;
        const success = await this.joinRoom(roomId, userId, role);
        
        if (success) {
          socket.join(roomId);
          socket.emit('joinedVoiceRoom', { roomId, success: true });
        } else {
          socket.emit('joinedVoiceRoom', { roomId, success: false });
        }
      });

      socket.on('leaveVoiceRoom', async (data) => {
        const { roomId, userId } = data;
        await this.leaveRoom(roomId, userId);
        socket.leave(roomId);
      });

      socket.on('raiseHand', async (data) => {
        const { roomId, userId } = data;
        await this.raiseHand(roomId, userId);
      });

      socket.on('voiceRoomChat', (data) => {
        const { roomId, message, userId } = data;
        socket.to(roomId).emit('voiceRoomChat', { message, userId, timestamp: new Date().toISOString() });
      });

      socket.on('startSpeaking', (data) => {
        const { roomId, userId } = data;
        const participants = this.roomParticipants.get(roomId);
        const participant = participants?.get(userId);
        
        if (participant) {
          participant.speakingTime = Date.now();
          socket.to(roomId).emit('userStartedSpeaking', { userId, roomId });
        }
      });

      socket.on('stopSpeaking', (data) => {
        const { roomId, userId } = data;
        const participants = this.roomParticipants.get(roomId);
        const participant = participants?.get(userId);
        
        if (participant && participant.speakingTime) {
          const duration = Date.now() - participant.speakingTime;
          participant.speakingTime += duration;
          socket.to(roomId).emit('userStoppedSpeaking', { userId, roomId });
        }
      });
    });
  }
}

export const voiceRoomService = (io: SocketIOServer) => new VoiceRoomService(io);