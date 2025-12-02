import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

export interface StreamConfig {
  title: string;
  description: string;
  category: string;
  isPrivate: boolean;
  maxViewers?: number;
  monetization: {
    enabled: boolean;
    ticketPrice?: number;
    donations: boolean;
    subscriptionOnly: boolean;
  };
}

export interface StreamMetrics {
  viewerCount: number;
  peakViewers: number;
  duration: number;
  revenue: number;
  chatMessages: number;
  likes: number;
}

export class LiveStreamingService extends EventEmitter {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private activeStreams = new Map<string, any>();
  private rtmpServer: string;

  constructor() {
    super();
    this.rtmpServer = process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live';
  }

  async createStream(creatorId: string, config: StreamConfig): Promise<{
    streamId: string;
    streamKey: string;
    rtmpUrl: string;
    playbackUrl: string;
  }> {
    const streamKey = this.generateStreamKey();
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: stream } = await this.supabase
      .from('live_streams')
      .insert({
        id: streamId,
        creator_id: creatorId,
        title: config.title,
        description: config.description,
        category: config.category,
        is_private: config.isPrivate,
        max_viewers: config.maxViewers,
        monetization: config.monetization,
        stream_key: streamKey,
        status: 'created',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return {
      streamId,
      streamKey,
      rtmpUrl: `${this.rtmpServer}/${streamKey}`,
      playbackUrl: `${process.env.HLS_SERVER_URL}/${streamKey}/index.m3u8`
    };
  }

  async startStream(streamId: string): Promise<void> {
    await this.supabase
      .from('live_streams')
      .update({
        status: 'live',
        started_at: new Date().toISOString()
      })
      .eq('id', streamId);

    this.activeStreams.set(streamId, {
      startTime: Date.now(),
      viewers: new Set(),
      metrics: {
        viewerCount: 0,
        peakViewers: 0,
        duration: 0,
        revenue: 0,
        chatMessages: 0,
        likes: 0
      }
    });

    this.emit('streamStarted', { streamId });
  }

  async endStream(streamId: string): Promise<StreamMetrics> {
    const streamData = this.activeStreams.get(streamId);
    if (!streamData) throw new Error('Stream not found');

    const duration = Date.now() - streamData.startTime;
    const metrics = {
      ...streamData.metrics,
      duration: Math.floor(duration / 1000)
    };

    await this.supabase
      .from('live_streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        final_metrics: metrics
      })
      .eq('id', streamId);

    this.activeStreams.delete(streamId);
    this.emit('streamEnded', { streamId, metrics });

    return metrics;
  }

  async joinStream(streamId: string, viewerId: string): Promise<boolean> {
    const { data: stream } = await this.supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .eq('status', 'live')
      .single();

    if (!stream) return false;

    // Check monetization requirements
    if (stream.monetization.enabled) {
      const hasAccess = await this.checkStreamAccess(streamId, viewerId, stream.monetization);
      if (!hasAccess) return false;
    }

    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.viewers.add(viewerId);
      streamData.metrics.viewerCount = streamData.viewers.size;
      streamData.metrics.peakViewers = Math.max(
        streamData.metrics.peakViewers,
        streamData.metrics.viewerCount
      );

      // Log viewer join
      await this.supabase
        .from('stream_viewers')
        .insert({
          stream_id: streamId,
          viewer_id: viewerId,
          joined_at: new Date().toISOString()
        });

      this.emit('viewerJoined', { streamId, viewerId, viewerCount: streamData.metrics.viewerCount });
    }

    return true;
  }

  async leaveStream(streamId: string, viewerId: string): Promise<void> {
    const streamData = this.activeStreams.get(streamId);
    if (streamData && streamData.viewers.has(viewerId)) {
      streamData.viewers.delete(viewerId);
      streamData.metrics.viewerCount = streamData.viewers.size;

      await this.supabase
        .from('stream_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('stream_id', streamId)
        .eq('viewer_id', viewerId)
        .is('left_at', null);

      this.emit('viewerLeft', { streamId, viewerId, viewerCount: streamData.metrics.viewerCount });
    }
  }

  async sendChatMessage(streamId: string, senderId: string, message: string): Promise<void> {
    const { data: chatMessage } = await this.supabase
      .from('stream_chat')
      .insert({
        stream_id: streamId,
        sender_id: senderId,
        message,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        users(username, display_name, avatar_url, verified)
      `)
      .single();

    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.metrics.chatMessages++;
    }

    this.emit('chatMessage', { streamId, message: chatMessage });
  }

  async likeStream(streamId: string, userId: string): Promise<void> {
    await this.supabase
      .from('stream_likes')
      .upsert({
        stream_id: streamId,
        user_id: userId,
        created_at: new Date().toISOString()
      });

    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.metrics.likes++;
    }

    this.emit('streamLiked', { streamId, userId });
  }

  async sendDonation(streamId: string, donorId: string, amount: number, message?: string): Promise<void> {
    const { data: donation } = await this.supabase
      .from('stream_donations')
      .insert({
        stream_id: streamId,
        donor_id: donorId,
        amount,
        message,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        users(username, display_name, avatar_url)
      `)
      .single();

    const streamData = this.activeStreams.get(streamId);
    if (streamData) {
      streamData.metrics.revenue += amount;
    }

    this.emit('donation', { streamId, donation });
  }

  async getActiveStreams(category?: string, limit: number = 20): Promise<any[]> {
    let query = this.supabase
      .from('live_streams')
      .select(`
        *,
        users(username, display_name, avatar_url, verified)
      `)
      .eq('status', 'live')
      .eq('is_private', false);

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getStreamHistory(creatorId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('live_streams')
      .select('*')
      .eq('creator_id', creatorId)
      .in('status', ['ended', 'live'])
      .order('created_at', { ascending: false });

    return data || [];
  }

  async getStreamAnalytics(streamId: string): Promise<any> {
    const [stream, viewers, chat, donations] = await Promise.all([
      this.supabase
        .from('live_streams')
        .select('*')
        .eq('id', streamId)
        .single(),
      
      this.supabase
        .from('stream_viewers')
        .select('*')
        .eq('stream_id', streamId),
      
      this.supabase
        .from('stream_chat')
        .select('count')
        .eq('stream_id', streamId),
      
      this.supabase
        .from('stream_donations')
        .select('amount')
        .eq('stream_id', streamId)
    ]);

    const totalDonations = donations.data?.reduce((sum, d) => sum + d.amount, 0) || 0;
    const uniqueViewers = new Set(viewers.data?.map(v => v.viewer_id)).size;

    return {
      stream: stream.data,
      uniqueViewers,
      totalChatMessages: chat.data?.[0]?.count || 0,
      totalDonations,
      viewerRetention: this.calculateViewerRetention(viewers.data || [])
    };
  }

  private async checkStreamAccess(streamId: string, viewerId: string, monetization: any): Promise<boolean> {
    if (monetization.subscriptionOnly) {
      const { data: subscription } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', viewerId)
        .eq('status', 'active')
        .single();

      return !!subscription;
    }

    if (monetization.ticketPrice) {
      const { data: ticket } = await this.supabase
        .from('stream_tickets')
        .select('*')
        .eq('stream_id', streamId)
        .eq('buyer_id', viewerId)
        .single();

      return !!ticket;
    }

    return true;
  }

  private generateStreamKey(): string {
    return `sk_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private calculateViewerRetention(viewers: any[]): number {
    if (viewers.length === 0) return 0;

    const viewersWithDuration = viewers.filter(v => v.left_at);
    if (viewersWithDuration.length === 0) return 100;

    const totalDuration = viewersWithDuration.reduce((sum, v) => {
      const duration = new Date(v.left_at).getTime() - new Date(v.joined_at).getTime();
      return sum + duration;
    }, 0);

    const averageDuration = totalDuration / viewersWithDuration.length;
    return Math.min(100, (averageDuration / (30 * 60 * 1000)) * 100); // 30 minutes as baseline
  }
}

export const liveStreamingService = new LiveStreamingService();