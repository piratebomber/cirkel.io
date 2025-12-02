export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  blockchain: 'ethereum' | 'polygon' | 'solana' | 'binance';
  name: string;
  description: string;
  image: string;
  animation?: string;
  attributes: NFTAttribute[];
  creator: string;
  owner: string;
  price?: number;
  currency: 'ETH' | 'MATIC' | 'SOL' | 'BNB' | 'USDC';
  royalty: number;
  isListed: boolean;
  listingPrice?: number;
  auction?: NFTAuction;
  metadata: NFTMetadata;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  collection?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
  max_value?: number;
}

export interface NFTAuction {
  id: string;
  startPrice: number;
  currentBid: number;
  highestBidder?: string;
  endTime: Date;
  bids: Bid[];
  isActive: boolean;
}

export interface Bid {
  id: string;
  bidder: string;
  amount: number;
  timestamp: Date;
  txHash: string;
}

export interface NFTMetadata {
  standard: 'ERC-721' | 'ERC-1155' | 'SPL';
  ipfsHash: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
  duration?: number;
  format: string;
  properties: { [key: string]: any };
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  type: 'metamask' | 'walletconnect' | 'coinbase' | 'phantom';
  blockchain: string;
  balance: TokenBalance[];
  nfts: string[];
  transactions: Transaction[];
  isConnected: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: number;
  usdValue: number;
  decimals: number;
  contractAddress?: string;
}

export interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'mint' | 'burn' | 'swap' | 'stake';
  from: string;
  to: string;
  amount: number;
  token: string;
  fee: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  timestamp: Date;
}

export interface TokenGatedCommunity {
  id: string;
  communityId: string;
  requirements: TokenRequirement[];
  benefits: string[];
  isActive: boolean;
  memberCount: number;
  createdAt: Date;
}

export interface TokenRequirement {
  type: 'token' | 'nft' | 'collection';
  contractAddress: string;
  minAmount?: number;
  specificTokenIds?: string[];
  blockchain: string;
}

export interface AITranslation {
  id: string;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  confidence: number;
  model: 'gpt-4' | 'claude' | 'google' | 'deepl';
  context?: string;
  formality?: 'formal' | 'informal';
  createdAt: Date;
}

export interface AIContentGeneration {
  id: string;
  type: 'caption' | 'hashtags' | 'description' | 'title' | 'script';
  prompt: string;
  generatedContent: string;
  model: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    tone: string;
    style: string;
  };
  userId: string;
  feedback?: 'positive' | 'negative';
  createdAt: Date;
}

export interface DeepfakeDetection {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  confidence: number;
  isDeepfake: boolean;
  analysis: {
    faceSwap: number;
    voiceCloning: number;
    lipSync: number;
    artifacts: string[];
  };
  model: string;
  processingTime: number;
  createdAt: Date;
}

export interface ViralPrediction {
  id: string;
  postId: string;
  prediction: {
    viralityScore: number;
    expectedReach: number;
    peakTime: Date;
    confidence: number;
  };
  factors: {
    contentQuality: number;
    timing: number;
    hashtags: number;
    engagement: number;
    trending: number;
  };
  recommendations: string[];
  actualPerformance?: {
    reach: number;
    engagement: number;
    accuracy: number;
  };
  createdAt: Date;
}

export interface ARFilter {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  type: 'face' | 'world' | 'hand' | 'body';
  category: string;
  effects: AREffect[];
  assets: ARAsset[];
  creator: string;
  usageCount: number;
  rating: number;
  isPublic: boolean;
  price?: number;
  createdAt: Date;
}

export interface AREffect {
  id: string;
  type: 'mesh' | 'particle' | 'animation' | 'shader' | 'tracking';
  properties: {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    color?: string;
    opacity?: number;
    animation?: string;
    trigger?: 'blink' | 'smile' | 'mouth_open' | 'gesture';
  };
}

export interface ARAsset {
  id: string;
  type: '3d_model' | 'texture' | 'animation' | 'sound';
  url: string;
  size: number;
  format: string;
  metadata: { [key: string]: any };
}

export interface ARExperience {
  id: string;
  name: string;
  description: string;
  location?: { lat: number; lng: number; radius: number };
  type: 'marker' | 'markerless' | 'location' | 'image_tracking';
  content: ARContent[];
  interactions: ARInteraction[];
  analytics: ARAnalytics;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ARContent {
  id: string;
  type: '3d_model' | 'video' | 'image' | 'text' | 'animation';
  url: string;
  position: { x: number; y: number; z: number };
  scale: number;
  rotation: { x: number; y: number; z: number };
  trigger?: string;
}

export interface ARInteraction {
  id: string;
  type: 'tap' | 'swipe' | 'pinch' | 'voice' | 'gesture';
  action: 'play' | 'pause' | 'rotate' | 'scale' | 'navigate' | 'share';
  target: string;
  parameters: { [key: string]: any };
}

export interface ARAnalytics {
  totalViews: number;
  uniqueUsers: number;
  averageSessionTime: number;
  interactions: { [key: string]: number };
  locations: { lat: number; lng: number; count: number }[];
  devices: { [key: string]: number };
}

export interface Avatar3D {
  id: string;
  userId: string;
  name: string;
  modelUrl: string;
  textureUrl: string;
  animations: Animation3D[];
  customizations: AvatarCustomization;
  accessories: AvatarAccessory[];
  isPublic: boolean;
  createdAt: Date;
}

export interface Animation3D {
  id: string;
  name: string;
  type: 'idle' | 'walk' | 'run' | 'dance' | 'gesture' | 'emotion';
  url: string;
  duration: number;
  loop: boolean;
}

export interface AvatarCustomization {
  body: {
    height: number;
    build: 'slim' | 'average' | 'athletic' | 'heavy';
    skinTone: string;
  };
  face: {
    shape: string;
    eyeColor: string;
    hairColor: string;
    hairStyle: string;
  };
  clothing: {
    top: string;
    bottom: string;
    shoes: string;
    accessories: string[];
  };
}

export interface AvatarAccessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'jewelry' | 'clothing' | 'prop';
  modelUrl: string;
  price?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isNFT: boolean;
}

export interface CRMIntegration {
  id: string;
  platform: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  apiKey: string;
  webhookUrl: string;
  syncSettings: {
    contacts: boolean;
    leads: boolean;
    opportunities: boolean;
    activities: boolean;
  };
  fieldMapping: { [key: string]: string };
  lastSync: Date;
  isActive: boolean;
}

export interface Lead {
  id: string;
  source: 'post' | 'message' | 'profile' | 'ad' | 'stream';
  sourceId: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    title?: string;
  };
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  tags: string[];
  notes: string[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesFunnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  automation: FunnelAutomation[];
  analytics: FunnelAnalytics;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface FunnelStage {
  id: string;
  name: string;
  description: string;
  actions: string[];
  conditions: { [key: string]: any };
  conversionRate: number;
}

export interface FunnelAutomation {
  id: string;
  trigger: 'time' | 'action' | 'score' | 'tag';
  conditions: { [key: string]: any };
  actions: AutomationAction[];
  isActive: boolean;
}

export interface AutomationAction {
  type: 'email' | 'message' | 'tag' | 'score' | 'assign' | 'webhook';
  parameters: { [key: string]: any };
  delay?: number;
}

export interface FunnelAnalytics {
  totalLeads: number;
  conversionRate: number;
  averageTime: number;
  dropoffPoints: { stage: string; rate: number }[];
  revenue: number;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  description: string;
  members: WorkspaceMember[];
  channels: WorkspaceChannel[];
  projects: WorkspaceProject[];
  permissions: WorkspacePermissions;
  settings: WorkspaceSettings;
  createdBy: string;
  createdAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  permissions: string[];
  joinedAt: Date;
}

export interface WorkspaceChannel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  messages: WorkspaceMessage[];
  createdAt: Date;
}

export interface WorkspaceMessage {
  id: string;
  userId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'video' | 'link';
  attachments: string[];
  reactions: { emoji: string; users: string[] }[];
  threadId?: string;
  createdAt: Date;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  tasks: ProjectTask[];
  members: string[];
  deadline?: Date;
  createdAt: Date;
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdAt: Date;
}

export interface WorkspacePermissions {
  canInvite: string[];
  canCreateChannels: string[];
  canCreateProjects: string[];
  canManageMembers: string[];
  canDeleteContent: string[];
}

export interface WorkspaceSettings {
  isPublic: boolean;
  allowGuests: boolean;
  requireApproval: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    digest: boolean;
  };
}

export interface MiniGame {
  id: string;
  name: string;
  type: 'puzzle' | 'arcade' | 'trivia' | 'social' | 'strategy';
  description: string;
  thumbnail: string;
  gameUrl: string;
  maxPlayers: number;
  duration: number;
  rewards: GameReward[];
  leaderboard: GameScore[];
  isMultiplayer: boolean;
  category: string;
  rating: number;
  playCount: number;
  createdBy: string;
  createdAt: Date;
}

export interface GameReward {
  type: 'points' | 'badge' | 'nft' | 'token' | 'discount';
  value: number;
  condition: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameScore {
  userId: string;
  score: number;
  rank: number;
  achievements: string[];
  playTime: number;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'engagement' | 'content' | 'social' | 'gaming' | 'milestone';
  criteria: AchievementCriteria;
  reward: AchievementReward;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlockedBy: string[];
  createdAt: Date;
}

export interface AchievementCriteria {
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: number | string;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all_time';
}

export interface AchievementReward {
  type: 'points' | 'badge' | 'title' | 'feature' | 'discount';
  value: number | string;
  duration?: number;
}

export interface Leaderboard {
  id: string;
  name: string;
  type: 'global' | 'community' | 'friends' | 'game';
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  entries: LeaderboardEntry[];
  rewards: LeaderboardReward[];
  isActive: boolean;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  change: number;
  streak: number;
}

export interface LeaderboardReward {
  rank: number;
  type: 'points' | 'badge' | 'nft' | 'premium';
  value: number | string;
}

export interface VirtualReward {
  id: string;
  name: string;
  type: 'collectible' | 'currency' | 'item' | 'boost';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image: string;
  animation?: string;
  properties: { [key: string]: any };
  tradeable: boolean;
  stackable: boolean;
  maxSupply?: number;
  currentSupply: number;
  createdAt: Date;
}

export interface EncryptionKey {
  id: string;
  userId: string;
  publicKey: string;
  privateKey: string;
  algorithm: 'RSA' | 'ECDSA' | 'Ed25519';
  keySize: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface EncryptedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  encryptedContent: string;
  signature: string;
  keyId: string;
  algorithm: string;
  createdAt: Date;
}

export interface ZKProof {
  id: string;
  userId: string;
  claim: string;
  proof: string;
  verifier: string;
  isValid: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export interface ThreatDetection {
  id: string;
  type: 'malware' | 'phishing' | 'spam' | 'ddos' | 'injection' | 'xss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  indicators: string[];
  mitigated: boolean;
  mitigationActions: string[];
  detectedAt: Date;
}

export interface ComplianceRule {
  id: string;
  regulation: 'GDPR' | 'CCPA' | 'COPPA' | 'HIPAA' | 'SOX' | 'PCI_DSS';
  requirement: string;
  implementation: string;
  status: 'compliant' | 'non_compliant' | 'pending';
  evidence: string[];
  lastAudit: Date;
  nextAudit: Date;
}

export interface DataRetention {
  id: string;
  dataType: string;
  retentionPeriod: number;
  deletionMethod: 'soft' | 'hard' | 'anonymize';
  legalBasis: string;
  isActive: boolean;
  createdAt: Date;
}