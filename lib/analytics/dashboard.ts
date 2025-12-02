import { createClient } from '@supabase/supabase-js';
import { Client } from '@elastic/elasticsearch';
import Redis from 'ioredis';

export interface AnalyticsMetrics {
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
    bounceRate: number;
    retentionRate: number;
  };
  contentMetrics: {
    postsCreated: number;
    likesGiven: number;
    commentsPosted: number;
    sharesCount: number;
    topHashtags: Array<{ tag: string; count: number }>;
    viralPosts: Array<{ id: string; engagement: number }>;
  };
  revenueMetrics: {
    totalRevenue: number;
    subscriptionRevenue: number;
    adRevenue: number;
    tipRevenue: number;
    conversionRate: number;
    averageRevenuePerUser: number;
  };
  performanceMetrics: {
    pageLoadTime: number;
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
    throughput: number;
  };
}

export class AnalyticsDashboard {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private elasticsearch = new Client({ node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200' });
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  async getUserEngagementMetrics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsMetrics['userEngagement']> {
    const interval = timeframe === '24h' ? '1 day' : timeframe === '7d' ? '7 days' : '30 days';
    
    const { data: activeUsers } = await this.supabase
      .from('analytics_events')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - this.getTimeframeMs(timeframe)).toISOString())
      .eq('event_type', 'page_view');

    const { data: sessions } = await this.supabase
      .from('analytics_events')
      .select('session_id, created_at')
      .gte('created_at', new Date(Date.now() - this.getTimeframeMs(timeframe)).toISOString())
      .order('created_at');

    const uniqueUsers = new Set(activeUsers?.map(u => u.user_id)).size;
    const sessionDuration = this.calculateAverageSessionDuration(sessions || []);
    
    return {
      dailyActiveUsers: timeframe === '24h' ? uniqueUsers : 0,
      weeklyActiveUsers: timeframe === '7d' ? uniqueUsers : 0,
      monthlyActiveUsers: timeframe === '30d' ? uniqueUsers : 0,
      sessionDuration,
      bounceRate: await this.calculateBounceRate(timeframe),
      retentionRate: await this.calculateRetentionRate(timeframe)
    };
  }

  async getContentMetrics(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<AnalyticsMetrics['contentMetrics']> {
    const startDate = new Date(Date.now() - this.getTimeframeMs(timeframe)).toISOString();

    const [posts, likes, comments, shares, hashtags] = await Promise.all([
      this.supabase.from('posts').select('id').gte('created_at', startDate),
      this.supabase.from('likes').select('id').gte('created_at', startDate),
      this.supabase.from('posts').select('id').gte('created_at', startDate).not('parent_id', 'is', null),
      this.supabase.from('reposts').select('id').gte('created_at', startDate),
      this.getTopHashtags(timeframe)
    ]);

    const viralPosts = await this.getViralPosts(timeframe);

    return {
      postsCreated: posts.data?.length || 0,
      likesGiven: likes.data?.length || 0,
      commentsPosted: comments.data?.length || 0,
      sharesCount: shares.data?.length || 0,
      topHashtags: hashtags,
      viralPosts
    };
  }

  async getRevenueMetrics(timeframe: '24h' | '7d' | '30d' = '30d'): Promise<AnalyticsMetrics['revenueMetrics']> {
    const startDate = new Date(Date.now() - this.getTimeframeMs(timeframe)).toISOString();

    const { data: transactions } = await this.supabase
      .from('transactions')
      .select('amount, type, created_at')
      .gte('created_at', startDate);

    const totalRevenue = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const subscriptionRevenue = transactions?.filter(t => t.type === 'subscription').reduce((sum, t) => sum + t.amount, 0) || 0;
    const adRevenue = transactions?.filter(t => t.type === 'advertisement').reduce((sum, t) => sum + t.amount, 0) || 0;
    const tipRevenue = transactions?.filter(t => t.type === 'tip').reduce((sum, t) => sum + t.amount, 0) || 0;

    const { data: users } = await this.supabase.from('users').select('id');
    const totalUsers = users?.length || 1;

    return {
      totalRevenue,
      subscriptionRevenue,
      adRevenue,
      tipRevenue,
      conversionRate: await this.calculateConversionRate(timeframe),
      averageRevenuePerUser: totalRevenue / totalUsers
    };
  }

  async getPerformanceMetrics(): Promise<AnalyticsMetrics['performanceMetrics']> {
    const cached = await this.redis.get('performance_metrics');
    if (cached) return JSON.parse(cached);

    const { data: performanceEvents } = await this.supabase
      .from('analytics_events')
      .select('metadata')
      .eq('event_type', 'performance')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const metrics = {
      pageLoadTime: this.calculateAverageLoadTime(performanceEvents || []),
      apiResponseTime: await this.getAverageApiResponseTime(),
      errorRate: await this.calculateErrorRate(),
      uptime: 99.9, // From monitoring service
      throughput: await this.calculateThroughput()
    };

    await this.redis.setex('performance_metrics', 300, JSON.stringify(metrics));
    return metrics;
  }

  async generateRealTimeMetrics() {
    const realTimeData = {
      activeUsers: await this.getCurrentActiveUsers(),
      postsPerMinute: await this.getPostsPerMinute(),
      engagementRate: await this.getCurrentEngagementRate(),
      serverLoad: await this.getServerLoad(),
      errorCount: await this.getRecentErrors()
    };

    await this.redis.publish('analytics:realtime', JSON.stringify(realTimeData));
    return realTimeData;
  }

  async createCustomReport(config: {
    metrics: string[];
    timeframe: string;
    filters: Record<string, any>;
    groupBy?: string;
  }) {
    const { metrics, timeframe, filters, groupBy } = config;
    
    let query = this.supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', new Date(Date.now() - this.getTimeframeMs(timeframe as any)).toISOString());

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data } = await query;
    
    return this.processCustomMetrics(data || [], metrics, groupBy);
  }

  private getTimeframeMs(timeframe: '24h' | '7d' | '30d'): number {
    switch (timeframe) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    const sessionGroups = sessions.reduce((acc, session) => {
      if (!acc[session.session_id]) acc[session.session_id] = [];
      acc[session.session_id].push(new Date(session.created_at).getTime());
      return acc;
    }, {});

    const durations = Object.values(sessionGroups).map((times: any) => {
      times.sort((a: number, b: number) => a - b);
      return times[times.length - 1] - times[0];
    });

    return durations.reduce((sum: number, duration: number) => sum + duration, 0) / durations.length / 1000;
  }

  private async calculateBounceRate(timeframe: string): Promise<number> {
    const startDate = new Date(Date.now() - this.getTimeframeMs(timeframe as any)).toISOString();
    
    const { data: sessions } = await this.supabase
      .from('analytics_events')
      .select('session_id, event_type')
      .gte('created_at', startDate);
    
    const sessionGroups = sessions?.reduce((acc, event) => {
      if (!acc[event.session_id]) acc[event.session_id] = [];
      acc[event.session_id].push(event.event_type);
      return acc;
    }, {} as Record<string, string[]>) || {};
    
    const totalSessions = Object.keys(sessionGroups).length;
    const bouncedSessions = Object.values(sessionGroups).filter(events => events.length === 1).length;
    
    return totalSessions > 0 ? bouncedSessions / totalSessions : 0;
  }

  private async calculateRetentionRate(timeframe: string): Promise<number> {
    const periodMs = this.getTimeframeMs(timeframe as any);
    const currentPeriodStart = new Date(Date.now() - periodMs).toISOString();
    const previousPeriodStart = new Date(Date.now() - 2 * periodMs).toISOString();
    const previousPeriodEnd = currentPeriodStart;
    
    const [currentUsers, previousUsers] = await Promise.all([
      this.supabase.from('analytics_events').select('user_id').gte('created_at', currentPeriodStart).eq('event_type', 'page_view'),
      this.supabase.from('analytics_events').select('user_id').gte('created_at', previousPeriodStart).lt('created_at', previousPeriodEnd).eq('event_type', 'page_view')
    ]);
    
    const currentUserIds = new Set(currentUsers.data?.map(u => u.user_id));
    const previousUserIds = new Set(previousUsers.data?.map(u => u.user_id));
    const retainedUsers = [...previousUserIds].filter(id => currentUserIds.has(id)).length;
    
    return previousUserIds.size > 0 ? retainedUsers / previousUserIds.size : 0;
  }

  private async getTopHashtags(timeframe: string): Promise<Array<{ tag: string; count: number }>> {
    const { data } = await this.supabase
      .from('posts')
      .select('hashtags')
      .gte('created_at', new Date(Date.now() - this.getTimeframeMs(timeframe as any)).toISOString());

    const hashtagCounts: Record<string, number> = {};
    data?.forEach(post => {
      post.hashtags?.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  private async getViralPosts(timeframe: string): Promise<Array<{ id: string; engagement: number }>> {
    const { data } = await this.supabase
      .from('posts')
      .select('id, like_count, repost_count, reply_count')
      .gte('created_at', new Date(Date.now() - this.getTimeframeMs(timeframe as any)).toISOString())
      .order('like_count', { ascending: false })
      .limit(10);

    return data?.map(post => ({
      id: post.id,
      engagement: post.like_count + post.repost_count + post.reply_count
    })) || [];
  }

  private async calculateConversionRate(timeframe: string): Promise<number> {
    const startDate = new Date(Date.now() - this.getTimeframeMs(timeframe as any)).toISOString();
    
    const [visitors, conversions] = await Promise.all([
      this.supabase.from('analytics_events').select('user_id').eq('event_type', 'page_view').gte('created_at', startDate),
      this.supabase.from('transactions').select('user_id').gte('created_at', startDate)
    ]);
    
    const uniqueVisitors = new Set(visitors.data?.map(v => v.user_id)).size;
    const uniqueConverters = new Set(conversions.data?.map(c => c.user_id)).size;
    
    return uniqueVisitors > 0 ? uniqueConverters / uniqueVisitors : 0;
  }

  private calculateAverageLoadTime(events: any[]): number {
    if (events.length === 0) return 0;
    const loadTimes = events.map(e => e.metadata?.loadTime || 0);
    return loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
  }

  private async getAverageApiResponseTime(): Promise<number> {
    // Implementation for API response time calculation
    return 150; // Placeholder
  }

  private async calculateErrorRate(): Promise<number> {
    // Implementation for error rate calculation
    return 0.01; // Placeholder
  }

  private async calculateThroughput(): Promise<number> {
    // Implementation for throughput calculation
    return 1000; // Placeholder
  }

  private async getCurrentActiveUsers(): Promise<number> {
    const activeUsers = await this.redis.scard('active_users');
    return activeUsers;
  }

  private async getPostsPerMinute(): Promise<number> {
    const { data } = await this.supabase
      .from('posts')
      .select('id')
      .gte('created_at', new Date(Date.now() - 60000).toISOString());
    
    return data?.length || 0;
  }

  private async getCurrentEngagementRate(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const [posts, interactions] = await Promise.all([
      this.supabase.from('posts').select('id').gte('created_at', fiveMinutesAgo),
      this.supabase.from('likes').select('id').gte('created_at', fiveMinutesAgo)
    ]);
    
    const postsCount = posts.data?.length || 0;
    const interactionsCount = interactions.data?.length || 0;
    
    return postsCount > 0 ? interactionsCount / postsCount : 0;
  }

  private async getServerLoad(): Promise<number> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 / 100;
    
    const activeConnections = await this.redis.get('active_connections') || '0';
    const connectionLoad = parseInt(activeConnections) / 1000;
    
    return Math.min((memoryPercent + cpuPercent + connectionLoad) / 3, 1);
  }

  private async getRecentErrors(): Promise<number> {
    const { data } = await this.supabase
      .from('analytics_events')
      .select('id')
      .eq('event_type', 'error')
      .gte('created_at', new Date(Date.now() - 300000).toISOString());
    
    return data?.length || 0;
  }

  private processCustomMetrics(data: any[], metrics: string[], groupBy?: string): any {
    const result: Record<string, any> = {};
    
    metrics.forEach(metric => {
      switch (metric) {
        case 'count':
          result.count = data.length;
          break;
        case 'unique_users':
          result.unique_users = new Set(data.map(d => d.user_id)).size;
          break;
        case 'avg_session_duration':
          const sessions = data.filter(d => d.event_type === 'session_end');
          result.avg_session_duration = sessions.reduce((sum, s) => sum + (s.metadata?.duration || 0), 0) / sessions.length || 0;
          break;
        case 'conversion_rate':
          const views = data.filter(d => d.event_type === 'page_view').length;
          const conversions = data.filter(d => d.event_type === 'conversion').length;
          result.conversion_rate = views > 0 ? conversions / views : 0;
          break;
      }
    });
    
    if (groupBy) {
      const grouped = data.reduce((acc, item) => {
        const key = item[groupBy] || 'unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
      
      result.grouped = Object.entries(grouped).map(([key, items]) => ({
        [groupBy]: key,
        count: (items as any[]).length,
        ...this.processCustomMetrics(items as any[], metrics.filter(m => m !== 'count'))
      }));
    }
    
    return result;
  }
}

export const analyticsDashboard = new AnalyticsDashboard();