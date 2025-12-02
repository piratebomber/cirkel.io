import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { EventEmitter } from 'events';

export interface APIConfig {
  baseURL: string;
  apiKey: string;
  version?: string;
  timeout?: number;
  retries?: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
  rateLimit?: RateLimitInfo;
}

export class CirkelSDK extends EventEmitter {
  private client: AxiosInstance;
  private config: APIConfig;
  private rateLimitInfo?: RateLimitInfo;

  constructor(config: APIConfig) {
    super();
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': `CirkelSDK/1.0.0`,
        'X-API-Version': config.version || 'v1'
      }
    });

    this.setupInterceptors();
  }

  // Posts API
  async getPosts(options: {
    userId?: string;
    communityId?: string;
    hashtag?: string;
    limit?: number;
    page?: number;
    sort?: 'latest' | 'popular' | 'trending';
  } = {}): Promise<APIResponse> {
    return this.request('GET', '/posts', { params: options });
  }

  async getPost(postId: string): Promise<APIResponse> {
    return this.request('GET', `/posts/${postId}`);
  }

  async createPost(data: {
    content: string;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    communityId?: string;
    visibility?: 'public' | 'followers' | 'private';
  }): Promise<APIResponse> {
    return this.request('POST', '/posts', data);
  }

  async updatePost(postId: string, data: Partial<{
    content: string;
    visibility: 'public' | 'followers' | 'private';
  }>): Promise<APIResponse> {
    return this.request('PUT', `/posts/${postId}`, data);
  }

  async deletePost(postId: string): Promise<APIResponse> {
    return this.request('DELETE', `/posts/${postId}`);
  }

  async likePost(postId: string): Promise<APIResponse> {
    return this.request('POST', `/posts/${postId}/like`);
  }

  async unlikePost(postId: string): Promise<APIResponse> {
    return this.request('DELETE', `/posts/${postId}/like`);
  }

  async repostPost(postId: string, comment?: string): Promise<APIResponse> {
    return this.request('POST', `/posts/${postId}/repost`, { comment });
  }

  // Users API
  async getUsers(options: {
    search?: string;
    verified?: boolean;
    limit?: number;
    page?: number;
  } = {}): Promise<APIResponse> {
    return this.request('GET', '/users', { params: options });
  }

  async getUser(userId: string): Promise<APIResponse> {
    return this.request('GET', `/users/${userId}`);
  }

  async getCurrentUser(): Promise<APIResponse> {
    return this.request('GET', '/users/me');
  }

  async updateUser(data: Partial<{
    displayName: string;
    bio: string;
    location: string;
    website: string;
    avatarUrl: string;
    bannerUrl: string;
  }>): Promise<APIResponse> {
    return this.request('PUT', '/users/me', data);
  }

  async followUser(userId: string): Promise<APIResponse> {
    return this.request('POST', `/users/${userId}/follow`);
  }

  async unfollowUser(userId: string): Promise<APIResponse> {
    return this.request('DELETE', `/users/${userId}/follow`);
  }

  async getFollowers(userId: string, options: { limit?: number; page?: number } = {}): Promise<APIResponse> {
    return this.request('GET', `/users/${userId}/followers`, { params: options });
  }

  async getFollowing(userId: string, options: { limit?: number; page?: number } = {}): Promise<APIResponse> {
    return this.request('GET', `/users/${userId}/following`, { params: options });
  }

  // Communities API
  async getCommunities(options: {
    category?: string;
    search?: string;
    limit?: number;
    page?: number;
  } = {}): Promise<APIResponse> {
    return this.request('GET', '/communities', { params: options });
  }

  async getCommunity(communityId: string): Promise<APIResponse> {
    return this.request('GET', `/communities/${communityId}`);
  }

  async createCommunity(data: {
    name: string;
    description: string;
    category: string;
    privacy: 'public' | 'private' | 'restricted';
    tags?: string[];
  }): Promise<APIResponse> {
    return this.request('POST', '/communities', data);
  }

  async joinCommunity(communityId: string): Promise<APIResponse> {
    return this.request('POST', `/communities/${communityId}/join`);
  }

  async leaveCommunity(communityId: string): Promise<APIResponse> {
    return this.request('DELETE', `/communities/${communityId}/join`);
  }

  // Messages API
  async getConversations(options: { limit?: number; page?: number } = {}): Promise<APIResponse> {
    return this.request('GET', '/messages/conversations', { params: options });
  }

  async getMessages(conversationId: string, options: { limit?: number; page?: number } = {}): Promise<APIResponse> {
    return this.request('GET', `/messages/conversations/${conversationId}`, { params: options });
  }

  async sendMessage(data: {
    recipientId?: string;
    conversationId?: string;
    content: string;
    mediaUrls?: string[];
  }): Promise<APIResponse> {
    return this.request('POST', '/messages', data);
  }

  // Search API
  async search(query: string, options: {
    type?: 'posts' | 'users' | 'communities' | 'all';
    filters?: Record<string, any>;
    limit?: number;
    page?: number;
  } = {}): Promise<APIResponse> {
    return this.request('GET', '/search', { 
      params: { q: query, ...options } 
    });
  }

  // Analytics API
  async getAnalytics(options: {
    metric: string;
    timeframe?: '24h' | '7d' | '30d';
    filters?: Record<string, any>;
  }): Promise<APIResponse> {
    return this.request('GET', '/analytics', { params: options });
  }

  // Webhooks API
  async createWebhook(data: {
    url: string;
    events: string[];
    secret?: string;
  }): Promise<APIResponse> {
    return this.request('POST', '/webhooks', data);
  }

  async getWebhooks(): Promise<APIResponse> {
    return this.request('GET', '/webhooks');
  }

  async updateWebhook(webhookId: string, data: Partial<{
    url: string;
    events: string[];
    active: boolean;
  }>): Promise<APIResponse> {
    return this.request('PUT', `/webhooks/${webhookId}`, data);
  }

  async deleteWebhook(webhookId: string): Promise<APIResponse> {
    return this.request('DELETE', `/webhooks/${webhookId}`);
  }

  // Utility methods
  async uploadMedia(file: File | Buffer, options: {
    type: 'image' | 'video' | 'audio' | 'document';
    filename?: string;
  }): Promise<APIResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', options.type);
    if (options.filename) formData.append('filename', options.filename);

    return this.request('POST', '/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.rateLimitInfo;
  }

  private async request(method: string, url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse> {
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        ...config
      });

      this.updateRateLimitInfo(response.headers);
      
      return {
        data: response.data.data || response.data,
        success: true,
        message: response.data.message,
        pagination: response.data.pagination,
        rateLimit: this.rateLimitInfo
      };
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  private setupInterceptors() {
    // Request interceptor for retry logic
    this.client.interceptors.request.use(
      (config) => {
        this.emit('request', { method: config.method, url: config.url });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.emit('response', { 
          status: response.status, 
          url: response.config.url 
        });
        return response;
      },
      async (error) => {
        if (error.response?.status === 429) {
          this.emit('rateLimitExceeded', this.rateLimitInfo);
          
          if (this.config.retries && this.config.retries > 0) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
            await this.delay(retryAfter * 1000);
            return this.client.request(error.config);
          }
        }
        
        this.emit('error', error);
        return Promise.reject(error);
      }
    );
  }

  private updateRateLimitInfo(headers: any) {
    if (headers['x-ratelimit-limit']) {
      this.rateLimitInfo = {
        limit: parseInt(headers['x-ratelimit-limit']),
        remaining: parseInt(headers['x-ratelimit-remaining']),
        reset: parseInt(headers['x-ratelimit-reset'])
      };
    }
  }

  private handleError(error: any) {
    if (error.response) {
      this.emit('apiError', {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data
      });
    } else if (error.request) {
      this.emit('networkError', error);
    } else {
      this.emit('error', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function for easy SDK initialization
export function createCirkelSDK(config: APIConfig): CirkelSDK {
  return new CirkelSDK(config);
}

// Type definitions for common responses
export interface Post {
  id: string;
  content: string;
  userId: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  likeCount: number;
  repostCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  verified: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  postCount: number;
  privacy: 'public' | 'private' | 'restricted';
  tags: string[];
  createdAt: string;
}