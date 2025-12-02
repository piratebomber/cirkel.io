export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'funnel' | 'cohort';
  title: string;
  dataSource: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval: number;
  lastUpdated: Date;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
  metrics: string[];
  dimensions: string[];
  filters: { [key: string]: any };
  timeRange: TimeRange;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string[];
  sortBy?: { field: string; order: 'asc' | 'desc' };
  limit?: number;
}

export interface TimeRange {
  type: 'relative' | 'absolute';
  value: string | { start: Date; end: Date };
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  field: string;
  options?: FilterOption[];
  defaultValue?: any;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface UserBehaviorTracking {
  id: string;
  userId: string;
  sessionId: string;
  event: string;
  properties: { [key: string]: any };
  timestamp: Date;
  page: string;
  referrer?: string;
  userAgent: string;
  ip: string;
  location?: GeoLocation;
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Heatmap {
  id: string;
  page: string;
  type: 'click' | 'scroll' | 'move' | 'attention';
  data: HeatmapPoint[];
  sessionCount: number;
  dateRange: { start: Date; end: Date };
  createdAt: Date;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  element?: string;
  timestamp: Date;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  trafficAllocation: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  significanceLevel: number;
  minimumSampleSize: number;
  results?: ABTestResults;
  createdBy: string;
  createdAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  trafficPercentage: number;
  changes: VariantChange[];
  isControl: boolean;
}

export interface VariantChange {
  type: 'element' | 'style' | 'content' | 'redirect';
  selector?: string;
  property?: string;
  value: any;
  originalValue?: any;
}

export interface ABTestResults {
  totalParticipants: number;
  conversionRate: { [variantId: string]: number };
  confidence: number;
  pValue: number;
  winner?: string;
  lift: { [variantId: string]: number };
  significance: boolean;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'engagement' | 'churn' | 'ltv' | 'conversion' | 'content_performance';
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'xgboost';
  features: string[];
  target: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingData: ModelTrainingData;
  predictions: ModelPrediction[];
  lastTrained: Date;
  isActive: boolean;
}

export interface ModelTrainingData {
  samples: number;
  features: number;
  timeRange: { start: Date; end: Date };
  validationSplit: number;
  crossValidation: number;
}

export interface ModelPrediction {
  id: string;
  userId: string;
  prediction: number;
  confidence: number;
  features: { [key: string]: any };
  actualOutcome?: number;
  createdAt: Date;
}

export interface SocialPlatform {
  id: string;
  name: string;
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'snapchat';
  apiCredentials: PlatformCredentials;
  isConnected: boolean;
  permissions: string[];
  rateLimits: RateLimit;
  lastSync: Date;
}

export interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  webhookUrl?: string;
}

export interface RateLimit {
  requests: number;
  window: number;
  remaining: number;
  resetAt: Date;
}

export interface CrossPost {
  id: string;
  content: string;
  media: string[];
  platforms: string[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  results: CrossPostResult[];
  createdBy: string;
  createdAt: Date;
}

export interface CrossPostResult {
  platform: string;
  postId?: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  metrics?: PostMetrics;
  publishedAt?: Date;
}

export interface PostMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagement: number;
  reach: number;
  impressions: number;
}

export interface UnifiedInbox {
  id: string;
  messages: UnifiedMessage[];
  filters: InboxFilter[];
  labels: InboxLabel[];
  automationRules: InboxAutomation[];
  unreadCount: number;
  lastSync: Date;
}

export interface UnifiedMessage {
  id: string;
  platform: string;
  type: 'direct_message' | 'comment' | 'mention' | 'review' | 'ad_comment';
  sender: MessageSender;
  content: string;
  media: string[];
  timestamp: Date;
  isRead: boolean;
  labels: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  response?: MessageResponse;
}

export interface MessageSender {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified: boolean;
  followerCount?: number;
}

export interface MessageResponse {
  content: string;
  sentAt: Date;
  sentBy: string;
  status: 'sent' | 'failed' | 'pending';
}

export interface InboxFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  actions: FilterAction[];
  isActive: boolean;
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: any;
}

export interface FilterAction {
  type: 'label' | 'assign' | 'priority' | 'auto_reply' | 'forward';
  value: any;
}

export interface InboxLabel {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface InboxAutomation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions: FilterCondition[];
  actions: FilterAction[];
  isActive: boolean;
  executionCount: number;
}

export interface AutomationTrigger {
  type: 'new_message' | 'keyword' | 'sentiment' | 'time' | 'user_action';
  config: { [key: string]: any };
}

export interface SocialListening {
  id: string;
  name: string;
  keywords: string[];
  platforms: string[];
  languages: string[];
  locations: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'all';
  mentions: SocialMention[];
  analytics: ListeningAnalytics;
  alerts: ListeningAlert[];
  isActive: boolean;
  createdAt: Date;
}

export interface SocialMention {
  id: string;
  platform: string;
  author: MessageSender;
  content: string;
  url: string;
  sentiment: number;
  reach: number;
  engagement: number;
  keywords: string[];
  location?: GeoLocation;
  timestamp: Date;
}

export interface ListeningAnalytics {
  totalMentions: number;
  sentimentDistribution: { positive: number; negative: number; neutral: number };
  topKeywords: { keyword: string; count: number }[];
  topInfluencers: { author: string; reach: number; mentions: number }[];
  trendingTopics: { topic: string; growth: number }[];
  geographicDistribution: { [location: string]: number };
}

export interface ListeningAlert {
  id: string;
  type: 'volume_spike' | 'sentiment_change' | 'influencer_mention' | 'crisis_detection';
  threshold: number;
  recipients: string[];
  isActive: boolean;
}

export interface CompetitorAnalysis {
  id: string;
  competitor: CompetitorProfile;
  metrics: CompetitorMetrics;
  contentAnalysis: ContentAnalysis;
  audienceAnalysis: AudienceAnalysis;
  benchmarks: Benchmark[];
  insights: CompetitorInsight[];
  lastUpdated: Date;
}

export interface CompetitorProfile {
  id: string;
  name: string;
  industry: string;
  platforms: { [platform: string]: string };
  website: string;
  description: string;
}

export interface CompetitorMetrics {
  followers: { [platform: string]: number };
  engagement: { [platform: string]: number };
  postFrequency: { [platform: string]: number };
  averageReach: { [platform: string]: number };
  growthRate: { [platform: string]: number };
}

export interface ContentAnalysis {
  topPerformingPosts: CompetitorPost[];
  contentTypes: { [type: string]: number };
  postingTimes: { [hour: string]: number };
  hashtags: { [hashtag: string]: number };
  themes: { [theme: string]: number };
}

export interface CompetitorPost {
  id: string;
  platform: string;
  content: string;
  media: string[];
  metrics: PostMetrics;
  publishedAt: Date;
}

export interface AudienceAnalysis {
  demographics: { [key: string]: number };
  interests: { [interest: string]: number };
  locations: { [location: string]: number };
  overlap: number;
  uniqueAudience: number;
}

export interface Benchmark {
  metric: string;
  ourValue: number;
  competitorValue: number;
  industryAverage: number;
  percentile: number;
}

export interface CompetitorInsight {
  type: 'opportunity' | 'threat' | 'trend' | 'gap';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendations: string[];
}

export interface VideoEditor {
  id: string;
  projectName: string;
  timeline: VideoTimeline;
  assets: VideoAsset[];
  effects: VideoEffect[];
  transitions: VideoTransition[];
  audio: AudioTrack[];
  settings: VideoSettings;
  exports: VideoExport[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoTimeline {
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  tracks: VideoTrack[];
}

export interface VideoTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image';
  clips: VideoClip[];
  isLocked: boolean;
  isMuted: boolean;
  opacity: number;
}

export interface VideoClip {
  id: string;
  assetId: string;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
  effects: string[];
  transitions: { in?: string; out?: string };
}

export interface VideoAsset {
  id: string;
  type: 'video' | 'audio' | 'image';
  name: string;
  url: string;
  duration?: number;
  size: number;
  metadata: VideoMetadata;
  thumbnail?: string;
}

export interface VideoMetadata {
  format: string;
  codec?: string;
  bitrate?: number;
  fps?: number;
  resolution?: { width: number; height: number };
  channels?: number;
  sampleRate?: number;
}

export interface VideoEffect {
  id: string;
  name: string;
  type: 'filter' | 'color' | 'motion' | 'distortion' | 'ai';
  parameters: { [key: string]: any };
  presets: EffectPreset[];
}

export interface EffectPreset {
  name: string;
  parameters: { [key: string]: any };
}

export interface VideoTransition {
  id: string;
  name: string;
  type: 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve';
  duration: number;
  parameters: { [key: string]: any };
}

export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  volume: number;
  isMuted: boolean;
  effects: AudioEffect[];
}

export interface AudioClip {
  id: string;
  assetId: string;
  startTime: number;
  endTime: number;
  fadeIn: number;
  fadeOut: number;
  volume: number;
}

export interface AudioEffect {
  id: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'noise_reduction';
  parameters: { [key: string]: any };
}

export interface VideoSettings {
  quality: 'draft' | 'preview' | 'high' | 'ultra';
  format: 'mp4' | 'mov' | 'avi' | 'webm';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  bitrate: number;
  fps: number;
  resolution: { width: number; height: number };
}

export interface VideoExport {
  id: string;
  settings: VideoSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  url?: string;
  size?: number;
  duration?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface PhotoEditor {
  id: string;
  projectName: string;
  canvas: PhotoCanvas;
  layers: PhotoLayer[];
  history: EditHistory[];
  filters: PhotoFilter[];
  adjustments: PhotoAdjustment[];
  exports: PhotoExport[];
  createdBy: string;
  createdAt: Date;
}

export interface PhotoCanvas {
  width: number;
  height: number;
  dpi: number;
  colorSpace: 'sRGB' | 'Adobe RGB' | 'ProPhoto RGB';
  background: string;
}

export interface PhotoLayer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'adjustment';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  transform: LayerTransform;
  content: LayerContent;
  mask?: LayerMask;
}

export interface LayerTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
}

export interface LayerContent {
  type: string;
  data: any;
  filters: string[];
  adjustments: string[];
}

export interface LayerMask {
  type: 'alpha' | 'vector' | 'clipping';
  data: any;
  inverted: boolean;
}

export interface EditHistory {
  id: string;
  action: string;
  timestamp: Date;
  data: any;
  canUndo: boolean;
}

export interface PhotoFilter {
  id: string;
  name: string;
  type: 'artistic' | 'blur' | 'distort' | 'noise' | 'sharpen' | 'stylize';
  parameters: { [key: string]: any };
  intensity: number;
}

export interface PhotoAdjustment {
  id: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'hue' | 'curves' | 'levels';
  values: { [key: string]: number };
}

export interface PhotoExport {
  id: string;
  format: 'jpg' | 'png' | 'webp' | 'tiff' | 'psd';
  quality: number;
  size: { width: number; height: number };
  dpi: number;
  colorSpace: string;
  url?: string;
  fileSize?: number;
  createdAt: Date;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  category: string;
  language: string;
  explicit: boolean;
  artwork: string;
  episodes: PodcastEpisode[];
  hosts: PodcastHost[];
  analytics: PodcastAnalytics;
  distribution: PodcastDistribution;
  monetization: PodcastMonetization;
  createdBy: string;
  createdAt: Date;
}

export interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  publishDate: Date;
  seasonNumber?: number;
  episodeNumber: number;
  transcript?: string;
  chapters: PodcastChapter[];
  analytics: EpisodeAnalytics;
}

export interface PodcastChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  url?: string;
  image?: string;
}

export interface PodcastHost {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  socialLinks: { [platform: string]: string };
}

export interface PodcastAnalytics {
  totalDownloads: number;
  subscribers: number;
  averageListenTime: number;
  completionRate: number;
  topEpisodes: string[];
  audienceGeography: { [country: string]: number };
  deviceBreakdown: { [device: string]: number };
  referralSources: { [source: string]: number };
}

export interface EpisodeAnalytics {
  downloads: number;
  listens: number;
  averageListenTime: number;
  completionRate: number;
  dropOffPoints: { time: number; percentage: number }[];
  engagement: { time: number; interactions: number }[];
}

export interface PodcastDistribution {
  platforms: DistributionPlatform[];
  rss: string;
  autoSubmit: boolean;
  customDomains: string[];
}

export interface DistributionPlatform {
  name: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
}

export interface PodcastMonetization {
  sponsorships: Sponsorship[];
  donations: boolean;
  premiumContent: boolean;
  merchandise: boolean;
  totalRevenue: number;
}

export interface Sponsorship {
  id: string;
  sponsor: string;
  type: 'pre_roll' | 'mid_roll' | 'post_roll' | 'host_read';
  duration: number;
  rate: number;
  startDate: Date;
  endDate: Date;
  script?: string;
}

export interface InteractiveContent {
  id: string;
  type: 'poll' | 'quiz' | 'survey' | 'contest' | 'game' | 'calculator';
  title: string;
  description: string;
  config: InteractiveConfig;
  responses: InteractiveResponse[];
  analytics: InteractiveAnalytics;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface InteractiveConfig {
  questions: InteractiveQuestion[];
  settings: InteractiveSettings;
  design: InteractiveDesign;
  logic: InteractiveLogic[];
}

export interface InteractiveQuestion {
  id: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'number' | 'rating' | 'ranking' | 'slider';
  question: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  logic?: QuestionLogic[];
}

export interface QuestionOption {
  id: string;
  text: string;
  image?: string;
  value?: any;
  isCorrect?: boolean;
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface QuestionLogic {
  condition: LogicCondition;
  action: LogicAction;
}

export interface LogicCondition {
  type: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface LogicAction {
  type: 'show_question' | 'hide_question' | 'jump_to' | 'end_survey';
  target?: string;
}

export interface InteractiveSettings {
  allowMultipleResponses: boolean;
  showResults: boolean;
  requireLogin: boolean;
  collectEmail: boolean;
  randomizeOptions: boolean;
  progressBar: boolean;
  timeLimit?: number;
}

export interface InteractiveDesign {
  theme: string;
  colors: { [key: string]: string };
  fonts: { [key: string]: string };
  layout: 'single' | 'multi' | 'wizard';
  animations: boolean;
}

export interface InteractiveLogic {
  id: string;
  trigger: LogicTrigger;
  conditions: LogicCondition[];
  actions: LogicAction[];
}

export interface LogicTrigger {
  type: 'question_answered' | 'score_reached' | 'time_elapsed' | 'page_loaded';
  questionId?: string;
  value?: any;
}

export interface InteractiveResponse {
  id: string;
  userId?: string;
  sessionId: string;
  answers: { [questionId: string]: any };
  score?: number;
  completedAt: Date;
  timeSpent: number;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  userAgent: string;
  ip: string;
  referrer?: string;
  location?: GeoLocation;
  device: string;
}

export interface InteractiveAnalytics {
  totalResponses: number;
  completionRate: number;
  averageTime: number;
  dropOffPoints: { questionId: string; percentage: number }[];
  responseDistribution: { [questionId: string]: { [option: string]: number } };
  scoreDistribution?: { [score: number]: number };
  demographics: { [key: string]: { [value: string]: number } };
}