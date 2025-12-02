export interface User {
  id: string
  username: string
  displayName: string
  email: string
  bio?: string
  pronouns?: string
  profilePicture?: string
  coverImage?: string
  isVerified: boolean
  followerCount: number
  followingCount: number
  postCount: number
  joinedAt: Date
  lastUsernameChange?: Date
  isGuest: boolean
  theme: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  gamification: GamificationData
  socialLinks: SocialLink[]
  location?: string
  website?: string
  birthDate?: Date
}

export interface Post {
  id: string
  authorId: string
  author: User
  content: string
  media: MediaItem[]
  visibility: 'public' | 'unlisted' | 'private'
  hashtags: string[]
  mentions: string[]
  replyToId?: string
  replyTo?: Post
  reposts: Repost[]
  likes: Like[]
  views: number
  engagement: EngagementStats
  createdAt: Date
  updatedAt?: Date
  isEdited: boolean
  editHistory: PostEdit[]
  communityId?: string
  community?: Community
  isPinned: boolean
  isDeleted: boolean
  moderationStatus: 'approved' | 'pending' | 'rejected'
  analytics: PostAnalytics
}

export interface MediaItem {
  id: string
  type: 'image' | 'video' | 'gif'
  url: string
  thumbnailUrl?: string
  altText?: string
  width: number
  height: number
  size: number
  duration?: number
}

export interface Repost {
  id: string
  userId: string
  user: User
  postId: string
  comment?: string
  createdAt: Date
}

export interface Like {
  id: string
  userId: string
  user: User
  postId: string
  createdAt: Date
}

export interface Comment {
  id: string
  postId: string
  authorId: string
  author: User
  content: string
  media: MediaItem[]
  likes: Like[]
  replies: Comment[]
  replyToId?: string
  createdAt: Date
  updatedAt?: Date
  isEdited: boolean
}

export interface Community {
  id: string
  name: string
  displayName: string
  description: string
  avatar?: string
  banner?: string
  memberCount: number
  postCount: number
  isPrivate: boolean
  rules: CommunityRule[]
  moderators: CommunityMember[]
  members: CommunityMember[]
  createdAt: Date
  creatorId: string
  creator: User
  tags: string[]
  settings: CommunitySettings
}

export interface CommunityMember {
  id: string
  userId: string
  user: User
  communityId: string
  role: 'owner' | 'moderator' | 'member'
  joinedAt: Date
  permissions: string[]
}

export interface CommunityRule {
  id: string
  title: string
  description: string
  order: number
}

export interface CommunitySettings {
  allowImages: boolean
  allowVideos: boolean
  requireApproval: boolean
  allowCrossPosting: boolean
  minimumKarma: number
}

export interface Message {
  id: string
  senderId: string
  sender: User
  receiverId: string
  receiver: User
  content: string
  media: MediaItem[]
  isRead: boolean
  createdAt: Date
  updatedAt?: Date
  isEdited: boolean
  replyToId?: string
  replyTo?: Message
  conversationId: string
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage?: Message
  lastActivity: Date
  isGroup: boolean
  name?: string
  avatar?: string
  createdAt: Date
  unreadCount: number
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data: any
  isRead: boolean
  createdAt: Date
  actionUrl?: string
  actorId?: string
  actor?: User
}

export type NotificationType = 
  | 'like'
  | 'repost'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'message'
  | 'community_invite'
  | 'community_post'
  | 'verification'
  | 'achievement'
  | 'system'

export interface NotificationSettings {
  email: boolean
  push: boolean
  likes: boolean
  reposts: boolean
  comments: boolean
  follows: boolean
  mentions: boolean
  messages: boolean
  communityActivity: boolean
  achievements: boolean
  systemUpdates: boolean
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private'
  messagePermissions: 'everyone' | 'followers' | 'none'
  showActivity: boolean
  showFollowers: boolean
  showFollowing: boolean
  indexable: boolean
}

export interface Follow {
  id: string
  followerId: string
  follower: User
  followingId: string
  following: User
  createdAt: Date
  notificationsEnabled: boolean
}

export interface Hashtag {
  id: string
  name: string
  postCount: number
  trendingScore: number
  category?: string
  description?: string
  createdAt: Date
  isBlocked: boolean
}

export interface TrendingTopic {
  id: string
  name: string
  type: 'hashtag' | 'user' | 'community' | 'keyword'
  postCount: number
  engagementRate: number
  trendingScore: number
  category: string
  location?: string
  timeframe: '1h' | '6h' | '24h' | '7d'
}

export interface Algorithm {
  id: string
  name: string
  description: string
  weights: AlgorithmWeights
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AlgorithmWeights {
  recency: number
  engagement: number
  relevance: number
  diversity: number
  userInteraction: number
  communityActivity: number
  trendingTopics: number
}

export interface FeedItem {
  id: string
  type: 'post' | 'repost' | 'community_post' | 'trending' | 'suggested_user'
  post?: Post
  repost?: Repost
  user?: User
  community?: Community
  score: number
  reason: string
  createdAt: Date
}

export interface EngagementStats {
  likes: number
  reposts: number
  comments: number
  views: number
  shares: number
  saves: number
  clickThroughRate: number
  engagementRate: number
}

export interface PostAnalytics {
  hourlyViews: number[]
  dailyViews: number[]
  weeklyViews: number[]
  demographics: {
    ageGroups: Record<string, number>
    locations: Record<string, number>
    devices: Record<string, number>
  }
  referrers: Record<string, number>
  peakEngagementTime: Date
  averageViewDuration: number
}

export interface PostEdit {
  id: string
  postId: string
  previousContent: string
  newContent: string
  editedAt: Date
  reason?: string
}

export interface GamificationData {
  level: number
  xp: number
  badges: Badge[]
  achievements: Achievement[]
  streak: number
  lastActivity: Date
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  isCompleted: boolean
  reward: {
    xp: number
    badge?: Badge
  }
}

export interface SocialLink {
  id: string
  platform: string
  url: string
  displayName: string
  isVerified: boolean
}

export interface ModerationAction {
  id: string
  type: 'warn' | 'mute' | 'suspend' | 'ban' | 'delete_post' | 'delete_comment'
  targetType: 'user' | 'post' | 'comment' | 'community'
  targetId: string
  moderatorId: string
  moderator: User
  reason: string
  duration?: number
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

export interface Report {
  id: string
  reporterId: string
  reporter: User
  targetType: 'user' | 'post' | 'comment' | 'community'
  targetId: string
  reason: string
  category: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'misinformation' | 'copyright' | 'other'
  description: string
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed'
  assignedTo?: string
  assignedModerator?: User
  createdAt: Date
  resolvedAt?: Date
  resolution?: string
}

export interface SearchResult {
  type: 'user' | 'post' | 'community' | 'hashtag'
  id: string
  title: string
  description: string
  avatar?: string
  url: string
  relevanceScore: number
  metadata: any
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
}

export interface SocketEvent {
  type: string
  data: any
  timestamp: Date
  userId?: string
}

export interface EmailProvider {
  domain: string
  name: string
  isAllowed: boolean
  isModerationOnly: boolean
}

export interface AppSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  guestBrowsingEnabled: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  rateLimit: {
    posts: number
    comments: number
    likes: number
    follows: number
  }
  moderationSettings: {
    autoModeration: boolean
    requireApproval: boolean
    spamDetection: boolean
  }
}