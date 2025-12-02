export interface ECommerceStore {
  id: string;
  name: string;
  description: string;
  logo: string;
  domain: string;
  currency: string;
  timezone: string;
  products: Product[];
  categories: ProductCategory[];
  orders: Order[];
  customers: Customer[];
  analytics: StoreAnalytics;
  settings: StoreSettings;
  integrations: StoreIntegration[];
  createdBy: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  barcode?: string;
  type: 'physical' | 'digital' | 'service' | 'subscription';
  status: 'active' | 'inactive' | 'draft' | 'archived';
  visibility: 'public' | 'private' | 'hidden';
  categories: string[];
  tags: string[];
  images: ProductImage[];
  videos: ProductVideo[];
  variants: ProductVariant[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  shipping: ProductShipping;
  seo: ProductSEO;
  attributes: ProductAttribute[];
  reviews: ProductReview[];
  analytics: ProductAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductVideo {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  duration: number;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  options: VariantOption[];
  pricing: ProductPricing;
  inventory: ProductInventory;
  images: string[];
  isDefault: boolean;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface ProductPricing {
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  compareAtPrice?: number;
  taxable: boolean;
  taxClass?: string;
  priceRules: PriceRule[];
}

export interface PriceRule {
  id: string;
  type: 'percentage' | 'fixed' | 'bulk' | 'tiered';
  value: number;
  conditions: PriceCondition[];
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface PriceCondition {
  type: 'quantity' | 'customer_group' | 'location' | 'time';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface ProductInventory {
  trackQuantity: boolean;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  locations: InventoryLocation[];
}

export interface InventoryLocation {
  locationId: string;
  quantity: number;
  reserved: number;
  available: number;
}

export interface ProductShipping {
  requiresShipping: boolean;
  weight?: number;
  dimensions?: ProductDimensions;
  shippingClass?: string;
  freeShipping: boolean;
  separateShipping: boolean;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export interface ProductSEO {
  title?: string;
  description?: string;
  keywords: string[];
  slug: string;
  canonicalUrl?: string;
  noIndex: boolean;
  noFollow: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select';
  isVisible: boolean;
  isFilterable: boolean;
}

export interface ProductReview {
  id: string;
  customerId: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  verified: boolean;
  helpful: number;
  reported: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface ProductAnalytics {
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
  returnRate: number;
  profitMargin: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  slug: string;
  parentId?: string;
  image?: string;
  seo: CategorySEO;
  isVisible: boolean;
  sortOrder: number;
  productCount: number;
}

export interface CategorySEO {
  title?: string;
  description?: string;
  keywords: string[];
  canonicalUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  billingAddress: Address;
  shippingAddress: Address;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  notes: string;
  tags: string[];
  refunds: Refund[];
  timeline: OrderTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded' | 'failed';
export type FulfillmentStatus = 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'shipped' | 'delivered';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
  tax: number;
  discount: number;
  image?: string;
  customizations: ItemCustomization[];
}

export interface ItemCustomization {
  name: string;
  value: string;
  price?: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'bank_transfer' | 'crypto' | 'cash_on_delivery';
  provider: string;
  transactionId?: string;
  reference?: string;
  gateway: PaymentGateway;
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  config: { [key: string]: any };
  fees: GatewayFee[];
  isActive: boolean;
}

export interface GatewayFee {
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
}

export interface ShippingInfo {
  method: string;
  provider: string;
  service: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
}

export interface Refund {
  id: string;
  amount: number;
  reason: string;
  items: RefundItem[];
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  processedAt?: Date;
  refundMethod: string;
  transactionId?: string;
}

export interface RefundItem {
  orderItemId: string;
  quantity: number;
  amount: number;
  reason: string;
}

export interface OrderTimeline {
  id: string;
  event: string;
  description: string;
  timestamp: Date;
  userId?: string;
  metadata?: { [key: string]: any };
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  addresses: CustomerAddress[];
  orders: string[];
  totalSpent: number;
  orderCount: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  tags: string[];
  notes: string;
  preferences: CustomerPreferences;
  loyalty: CustomerLoyalty;
  segments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping';
  address: Address;
  isDefault: boolean;
}

export interface CustomerPreferences {
  marketing: MarketingPreferences;
  communication: CommunicationPreferences;
  privacy: PrivacyPreferences;
}

export interface MarketingPreferences {
  emailMarketing: boolean;
  smsMarketing: boolean;
  pushNotifications: boolean;
  personalizedOffers: boolean;
  productRecommendations: boolean;
}

export interface CommunicationPreferences {
  orderUpdates: boolean;
  shippingNotifications: boolean;
  promotionalEmails: boolean;
  newsletter: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

export interface PrivacyPreferences {
  dataCollection: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
  cookieConsent: boolean;
}

export interface CustomerLoyalty {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  joinDate: Date;
  expirationDate?: Date;
  rewards: LoyaltyReward[];
}

export interface LoyaltyReward {
  id: string;
  type: 'points' | 'discount' | 'free_shipping' | 'free_product';
  value: number;
  description: string;
  expirationDate?: Date;
  isRedeemed: boolean;
  redeemedAt?: Date;
}

export interface StoreAnalytics {
  overview: StoreOverview;
  sales: SalesAnalytics;
  products: ProductsAnalytics;
  customers: CustomersAnalytics;
  marketing: MarketingAnalytics;
  inventory: InventoryAnalytics;
}

export interface StoreOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  returnRate: number;
  profitMargin: number;
  growthRate: number;
}

export interface SalesAnalytics {
  revenueByPeriod: { period: string; revenue: number }[];
  ordersByPeriod: { period: string; orders: number }[];
  topSellingProducts: { productId: string; sales: number; revenue: number }[];
  salesByChannel: { channel: string; sales: number; percentage: number }[];
  salesByLocation: { location: string; sales: number; percentage: number }[];
  seasonalTrends: SeasonalTrend[];
}

export interface SeasonalTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
  forecast: number;
}

export interface ProductsAnalytics {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  topCategories: { categoryId: string; sales: number; revenue: number }[];
  productPerformance: ProductPerformance[];
}

export interface ProductPerformance {
  productId: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  returnRate: number;
  profitMargin: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CustomersAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerLifetimeValue: number;
  customerAcquisitionCost: number;
  retentionRate: number;
  churnRate: number;
  segmentAnalysis: CustomerSegmentAnalysis[];
}

export interface CustomerSegmentAnalysis {
  segmentId: string;
  size: number;
  averageOrderValue: number;
  frequency: number;
  lifetimeValue: number;
  profitability: number;
}

export interface MarketingAnalytics {
  campaignPerformance: CampaignPerformance[];
  channelAttribution: ChannelAttribution[];
  customerAcquisition: AcquisitionAnalytics;
  emailMarketing: EmailMarketingAnalytics;
  socialMedia: SocialMediaAnalytics;
}

export interface CampaignPerformance {
  campaignId: string;
  name: string;
  type: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
}

export interface ChannelAttribution {
  channel: string;
  sessions: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface AcquisitionAnalytics {
  sources: AcquisitionSource[];
  cost: AcquisitionCost;
  funnel: AcquisitionFunnel;
}

export interface AcquisitionSource {
  source: string;
  customers: number;
  cost: number;
  costPerAcquisition: number;
  lifetimeValue: number;
  roi: number;
}

export interface AcquisitionCost {
  total: number;
  perCustomer: number;
  byChannel: { [channel: string]: number };
  trend: { period: string; cost: number }[];
}

export interface AcquisitionFunnel {
  stages: FunnelStage[];
  conversionRates: number[];
  dropoffReasons: { [stage: string]: string[] };
}

export interface EmailMarketingAnalytics {
  campaigns: EmailCampaignAnalytics[];
  automation: EmailAutomationAnalytics[];
  listGrowth: ListGrowthAnalytics;
  engagement: EmailEngagementAnalytics;
}

export interface EmailCampaignAnalytics {
  campaignId: string;
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
  unsubscribed: number;
}

export interface EmailAutomationAnalytics {
  automationId: string;
  name: string;
  triggers: number;
  completed: number;
  revenue: number;
  conversionRate: number;
}

export interface ListGrowthAnalytics {
  subscribers: number;
  growth: number;
  churnRate: number;
  sources: { [source: string]: number };
  segments: { [segment: string]: number };
}

export interface EmailEngagementAnalytics {
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  spamRate: number;
  engagementScore: number;
}

export interface SocialMediaAnalytics {
  platforms: SocialPlatformAnalytics[];
  totalFollowers: number;
  totalEngagement: number;
  reachGrowth: number;
  topPosts: SocialPostAnalytics[];
}

export interface SocialPlatformAnalytics {
  platform: string;
  followers: number;
  engagement: number;
  reach: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface SocialPostAnalytics {
  postId: string;
  platform: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface InventoryAnalytics {
  totalValue: number;
  turnoverRate: number;
  daysOfInventory: number;
  stockouts: number;
  overstock: number;
  deadStock: number;
  fastMoving: string[];
  slowMoving: string[];
}

export interface StoreSettings {
  general: GeneralSettings;
  checkout: CheckoutSettings;
  shipping: ShippingSettings;
  tax: TaxSettings;
  payments: PaymentSettings;
  notifications: NotificationSettings;
  seo: SEOSettings;
  analytics: AnalyticsSettings;
}

export interface GeneralSettings {
  storeName: string;
  storeDescription: string;
  logo: string;
  favicon: string;
  currency: string;
  timezone: string;
  language: string;
  weightUnit: 'kg' | 'lb';
  dimensionUnit: 'cm' | 'in';
}

export interface CheckoutSettings {
  guestCheckout: boolean;
  accountCreation: 'optional' | 'required' | 'disabled';
  addressValidation: boolean;
  orderNotes: boolean;
  termsAndConditions: boolean;
  privacyPolicy: boolean;
  minimumOrderAmount?: number;
}

export interface ShippingSettings {
  zones: ShippingZone[];
  methods: ShippingMethod[];
  freeShippingThreshold?: number;
  handlingFee?: number;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  states: string[];
  postalCodes: string[];
  methods: string[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  type: 'flat_rate' | 'free' | 'calculated' | 'pickup';
  cost?: number;
  conditions: ShippingCondition[];
  isActive: boolean;
}

export interface ShippingCondition {
  type: 'weight' | 'price' | 'quantity' | 'dimensions';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: any;
}

export interface TaxSettings {
  enabled: boolean;
  inclusive: boolean;
  displayPrices: 'excluding' | 'including' | 'both';
  rates: TaxRate[];
  exemptions: TaxExemption[];
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  countries: string[];
  states: string[];
  cities: string[];
  postalCodes: string[];
  productCategories: string[];
}

export interface TaxExemption {
  id: string;
  name: string;
  type: 'customer_group' | 'product_category' | 'location';
  criteria: { [key: string]: any };
}

export interface PaymentSettings {
  gateways: PaymentGateway[];
  acceptedMethods: string[];
  currency: string;
  testMode: boolean;
}

export interface NotificationSettings {
  orderConfirmation: NotificationConfig;
  orderUpdates: NotificationConfig;
  shippingNotifications: NotificationConfig;
  lowStock: NotificationConfig;
  newCustomer: NotificationConfig;
}

export interface NotificationConfig {
  enabled: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  template: string;
  recipients: string[];
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  robotsTxt: string;
  sitemap: boolean;
  structuredData: boolean;
  socialSharing: SocialSharingSettings;
}

export interface SocialSharingSettings {
  enabled: boolean;
  platforms: string[];
  defaultImage: string;
  openGraph: OpenGraphSettings;
  twitterCard: TwitterCardSettings;
}

export interface OpenGraphSettings {
  title: string;
  description: string;
  image: string;
  type: string;
}

export interface TwitterCardSettings {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site: string;
  creator: string;
}

export interface AnalyticsSettings {
  googleAnalytics: GoogleAnalyticsSettings;
  facebookPixel: FacebookPixelSettings;
  customTracking: CustomTrackingSettings[];
}

export interface GoogleAnalyticsSettings {
  enabled: boolean;
  trackingId: string;
  enhancedEcommerce: boolean;
  demographics: boolean;
  remarketing: boolean;
}

export interface FacebookPixelSettings {
  enabled: boolean;
  pixelId: string;
  events: string[];
  customEvents: CustomEventSettings[];
}

export interface CustomEventSettings {
  name: string;
  trigger: string;
  parameters: { [key: string]: any };
}

export interface CustomTrackingSettings {
  name: string;
  code: string;
  placement: 'head' | 'body' | 'footer';
  pages: string[];
}

export interface StoreIntegration {
  id: string;
  name: string;
  type: 'payment' | 'shipping' | 'inventory' | 'marketing' | 'analytics' | 'crm';
  provider: string;
  config: IntegrationConfig;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: 'recurring' | 'one_time' | 'usage_based';
  billing: BillingConfig;
  features: PlanFeature[];
  limits: PlanLimit[];
  pricing: PlanPricing[];
  trial: TrialConfig;
  addons: PlanAddon[];
  isActive: boolean;
  createdAt: Date;
}

export interface BillingConfig {
  interval: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  billingCycles?: number;
  gracePeriod: number;
  retryAttempts: number;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  type: 'boolean' | 'numeric' | 'text';
  value: any;
  isHighlight: boolean;
}

export interface PlanLimit {
  resource: string;
  limit: number;
  unit: string;
  overage: OverageConfig;
}

export interface OverageConfig {
  allowed: boolean;
  rate: number;
  unit: string;
  threshold?: number;
}

export interface PlanPricing {
  currency: string;
  amount: number;
  setupFee?: number;
  discounts: PricingDiscount[];
}

export interface PricingDiscount {
  type: 'percentage' | 'fixed' | 'free_months';
  value: number;
  duration?: number;
  conditions: DiscountCondition[];
}

export interface DiscountCondition {
  type: 'billing_cycle' | 'customer_type' | 'promotion_code';
  value: any;
}

export interface TrialConfig {
  enabled: boolean;
  duration: number;
  unit: 'days' | 'weeks' | 'months';
  requiresPayment: boolean;
  features: string[];
}

export interface PlanAddon {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'usage' | 'support';
  pricing: AddonPricing;
  isOptional: boolean;
}

export interface AddonPricing {
  type: 'fixed' | 'per_unit' | 'tiered';
  amount: number;
  currency: string;
  tiers?: PricingTier[];
}

export interface PricingTier {
  from: number;
  to?: number;
  price: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  endedAt?: Date;
  billing: SubscriptionBilling;
  usage: SubscriptionUsage[];
  addons: SubscriptionAddon[];
  discounts: SubscriptionDiscount[];
  invoices: string[];
  paymentMethod: string;
  nextBillingDate: Date;
  createdAt: Date;
}

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'unpaid' | 'incomplete';

export interface SubscriptionBilling {
  amount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  nextAmount?: number;
  prorationDate?: Date;
}

export interface SubscriptionUsage {
  resource: string;
  quantity: number;
  unit: string;
  period: { start: Date; end: Date };
  overage: number;
  cost: number;
}

export interface SubscriptionAddon {
  addonId: string;
  quantity: number;
  amount: number;
  addedAt: Date;
}

export interface SubscriptionDiscount {
  id: string;
  type: 'coupon' | 'promotion' | 'loyalty';
  amount: number;
  percentage?: number;
  duration?: number;
  appliedAt: Date;
  expiresAt?: Date;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  description: string;
  type: 'revenue_share' | 'fixed_commission' | 'tiered' | 'hybrid';
  commission: CommissionStructure;
  requirements: AffiliateRequirements;
  terms: AffiliateTerms;
  tracking: AffiliateTracking;
  payouts: AffiliatePayout;
  affiliates: Affiliate[];
  analytics: AffiliateAnalytics;
  isActive: boolean;
  createdAt: Date;
}

export interface CommissionStructure {
  type: 'percentage' | 'fixed' | 'tiered';
  rate: number;
  tiers?: CommissionTier[];
  minimumPayout: number;
  cookieDuration: number;
}

export interface CommissionTier {
  from: number;
  to?: number;
  rate: number;
  type: 'percentage' | 'fixed';
}

export interface AffiliateRequirements {
  minimumFollowers?: number;
  minimumEngagement?: number;
  approvalRequired: boolean;
  allowedCountries: string[];
  excludedCategories: string[];
  qualityScore?: number;
}

export interface AffiliateTerms {
  agreementUrl: string;
  paymentTerms: string;
  prohibitedActivities: string[];
  brandGuidelines: string;
  promotionalMaterials: PromotionalMaterial[];
}

export interface PromotionalMaterial {
  id: string;
  type: 'banner' | 'text_link' | 'product_feed' | 'video' | 'social_post';
  name: string;
  description: string;
  url: string;
  dimensions?: string;
  format?: string;
  downloadCount: number;
}

export interface AffiliateTracking {
  method: 'cookie' | 'fingerprint' | 'postback' | 'pixel';
  attribution: 'first_click' | 'last_click' | 'multi_touch';
  cookieDuration: number;
  crossDevice: boolean;
  fraudDetection: FraudDetection;
}

export interface FraudDetection {
  enabled: boolean;
  rules: FraudRule[];
  actions: FraudAction[];
}

export interface FraudRule {
  id: string;
  name: string;
  type: 'ip_blocking' | 'velocity_check' | 'pattern_detection' | 'device_fingerprint';
  threshold: number;
  timeWindow: number;
  isActive: boolean;
}

export interface FraudAction {
  trigger: string;
  action: 'flag' | 'block' | 'review' | 'notify';
  severity: 'low' | 'medium' | 'high';
}

export interface AffiliatePayout {
  schedule: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  method: 'bank_transfer' | 'paypal' | 'check' | 'crypto';
  minimumAmount: number;
  holdingPeriod: number;
  currency: string;
  fees: PayoutFee[];
}

export interface PayoutFee {
  type: 'percentage' | 'fixed';
  amount: number;
  description: string;
}

export interface Affiliate {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'active' | 'suspended' | 'terminated';
  referralCode: string;
  customDomain?: string;
  profile: AffiliateProfile;
  performance: AffiliatePerformance;
  commissions: AffiliateCommission[];
  payouts: AffiliatePayoutRecord[];
  materials: string[];
  joinedAt: Date;
  approvedAt?: Date;
}

export interface AffiliateProfile {
  businessName?: string;
  website?: string;
  socialMedia: { [platform: string]: string };
  audience: AudienceProfile;
  experience: string;
  promotionMethods: string[];
  niche: string[];
}

export interface AudienceProfile {
  size: number;
  demographics: { [key: string]: number };
  interests: string[];
  engagementRate: number;
  geography: { [country: string]: number };
}

export interface AffiliatePerformance {
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  commissionEarned: number;
  averageOrderValue: number;
  topProducts: string[];
  monthlyStats: MonthlyStats[];
}

export interface MonthlyStats {
  month: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}

export interface AffiliateCommission {
  id: string;
  orderId: string;
  amount: number;
  rate: number;
  type: 'sale' | 'lead' | 'click';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  earnedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
}

export interface AffiliatePayoutRecord {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  commissions: string[];
  fees: number;
  netAmount: number;
  processedAt?: Date;
  reference?: string;
}

export interface AffiliateAnalytics {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommissions: number;
  averageCommissionRate: number;
  topPerformers: AffiliateRanking[];
  conversionFunnel: AffiliateFunnel;
}

export interface AffiliateRanking {
  affiliateId: string;
  rank: number;
  metric: string;
  value: number;
  change: number;
}

export interface AffiliateFunnel {
  stages: AffiliateFunnelStage[];
  conversionRates: number[];
  dropoffReasons: { [stage: string]: string[] };
}

export interface AffiliateFunnelStage {
  name: string;
  count: number;
  conversionRate: number;
}

export interface DigitalMarketplace {
  id: string;
  name: string;
  description: string;
  categories: MarketplaceCategory[];
  vendors: MarketplaceVendor[];
  products: DigitalProduct[];
  transactions: MarketplaceTransaction[];
  reviews: MarketplaceReview[];
  analytics: MarketplaceAnalytics;
  settings: MarketplaceSettings;
  createdAt: Date;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  parentId?: string;
  commission: number;
  requirements: CategoryRequirements;
  isActive: boolean;
}

export interface CategoryRequirements {
  minimumQuality: number;
  requiredFields: string[];
  approvalRequired: boolean;
  restrictions: string[];
}

export interface MarketplaceVendor {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  logo: string;
  website?: string;
  status: 'pending' | 'approved' | 'active' | 'suspended';
  verification: VendorVerification;
  profile: VendorProfile;
  products: string[];
  sales: VendorSales;
  ratings: VendorRatings;
  payouts: VendorPayout[];
  joinedAt: Date;
}

export interface VendorVerification {
  identity: boolean;
  business: boolean;
  tax: boolean;
  bank: boolean;
  documents: VerificationDocument[];
}

export interface VerificationDocument {
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
}

export interface VendorProfile {
  bio: string;
  specialties: string[];
  experience: string;
  portfolio: PortfolioItem[];
  certifications: Certification[];
  socialMedia: { [platform: string]: string };
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  url?: string;
  category: string;
  tags: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  url?: string;
  issuedAt: Date;
  expiresAt?: Date;
}

export interface VendorSales {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  conversionRate: number;
  refundRate: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface VendorRatings {
  overall: number;
  quality: number;
  communication: number;
  delivery: number;
  reviewCount: number;
  distribution: { [rating: number]: number };
}

export interface VendorPayout {
  id: string;
  amount: number;
  commission: number;
  fees: number;
  netAmount: number;
  period: { start: Date; end: Date };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  reference?: string;
  processedAt?: Date;
}

export interface DigitalProduct {
  id: string;
  vendorId: string;
  type: 'ebook' | 'course' | 'software' | 'template' | 'audio' | 'video' | 'graphics' | 'plugin';
  name: string;
  description: string;
  shortDescription: string;
  images: string[];
  preview: ProductPreview;
  files: DigitalFile[];
  pricing: DigitalPricing;
  licensing: ProductLicensing;
  requirements: ProductRequirements;
  features: string[];
  tags: string[];
  category: string;
  subcategory: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'suspended';
  sales: DigitalProductSales;
  reviews: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductPreview {
  type: 'image' | 'video' | 'demo' | 'sample';
  url: string;
  thumbnail?: string;
  duration?: number;
}

export interface DigitalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  downloadLimit?: number;
  expirationDays?: number;
  isMainFile: boolean;
}

export interface DigitalPricing {
  type: 'free' | 'paid' | 'freemium' | 'subscription';
  price: number;
  currency: string;
  discounts: PriceDiscount[];
  bundles: ProductBundle[];
}

export interface PriceDiscount {
  type: 'percentage' | 'fixed' | 'bulk';
  value: number;
  minQuantity?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ProductBundle {
  id: string;
  name: string;
  products: string[];
  price: number;
  savings: number;
}

export interface ProductLicensing {
  type: 'personal' | 'commercial' | 'extended' | 'exclusive';
  terms: string;
  restrictions: string[];
  attribution: boolean;
  resale: boolean;
  modification: boolean;
}

export interface ProductRequirements {
  system: SystemRequirements;
  software: SoftwareRequirements;
  skills: SkillRequirements;
}

export interface SystemRequirements {
  os: string[];
  memory?: string;
  storage?: string;
  processor?: string;
  graphics?: string;
}

export interface SoftwareRequirements {
  required: SoftwareItem[];
  recommended: SoftwareItem[];
}

export interface SoftwareItem {
  name: string;
  version?: string;
  url?: string;
}

export interface SkillRequirements {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[];
  estimatedTime?: string;
}

export interface DigitalProductSales {
  totalSales: number;
  totalRevenue: number;
  downloads: number;
  views: number;
  conversionRate: number;
  averageRating: number;
  reviewCount: number;
}

export interface MarketplaceTransaction {
  id: string;
  buyerId: string;
  vendorId: string;
  productId: string;
  type: 'purchase' | 'subscription' | 'license_upgrade';
  amount: number;
  commission: number;
  vendorEarnings: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  paymentMethod: string;
  downloadInfo: DownloadInfo;
  license: TransactionLicense;
  createdAt: Date;
}

export interface DownloadInfo {
  downloadCount: number;
  maxDownloads?: number;
  expiresAt?: Date;
  downloadUrls: DownloadUrl[];
}

export interface DownloadUrl {
  fileId: string;
  url: string;
  expiresAt: Date;
}

export interface TransactionLicense {
  type: string;
  key?: string;
  activations?: number;
  maxActivations?: number;
  expiresAt?: Date;
}

export interface MarketplaceReview {
  id: string;
  productId: string;
  buyerId: string;
  vendorId: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  images: string[];
  verified: boolean;
  helpful: number;
  reported: number;
  response?: VendorResponse;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface VendorResponse {
  content: string;
  respondedAt: Date;
}

export interface MarketplaceAnalytics {
  overview: MarketplaceOverview;
  vendors: MarketplaceVendorAnalytics;
  products: MarketplaceProductAnalytics;
  buyers: MarketplaceBuyerAnalytics;
  revenue: MarketplaceRevenueAnalytics;
}

export interface MarketplaceOverview {
  totalVendors: number;
  activeVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalTransactions: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface MarketplaceVendorAnalytics {
  topVendors: VendorRanking[];
  vendorGrowth: { period: string; count: number }[];
  averageEarnings: number;
  retentionRate: number;
}

export interface VendorRanking {
  vendorId: string;
  rank: number;
  sales: number;
  revenue: number;
  rating: number;
}

export interface MarketplaceProductAnalytics {
  topProducts: ProductRanking[];
  categoryPerformance: CategoryPerformance[];
  priceAnalysis: PriceAnalysis;
  qualityMetrics: QualityMetrics;
}

export interface ProductRanking {
  productId: string;
  rank: number;
  sales: number;
  revenue: number;
  rating: number;
  downloads: number;
}

export interface CategoryPerformance {
  categoryId: string;
  products: number;
  sales: number;
  revenue: number;
  averagePrice: number;
  conversionRate: number;
}

export interface PriceAnalysis {
  averagePrice: number;
  priceRanges: { [range: string]: number };
  priceVsPerformance: { price: number; performance: number }[];
}

export interface QualityMetrics {
  averageRating: number;
  ratingDistribution: { [rating: number]: number };
  approvalRate: number;
  rejectionReasons: { [reason: string]: number };
}

export interface MarketplaceBuyerAnalytics {
  totalBuyers: number;
  activeBuyers: number;
  averageSpend: number;
  repeatPurchaseRate: number;
  topCategories: { categoryId: string; purchases: number }[];
}

export interface MarketplaceRevenueAnalytics {
  totalRevenue: number;
  commissionRevenue: number;
  vendorPayouts: number;
  revenueGrowth: { period: string; revenue: number }[];
  revenueByCategory: { categoryId: string; revenue: number }[];
}

export interface MarketplaceSettings {
  commission: CommissionSettings;
  approval: ApprovalSettings;
  quality: QualitySettings;
  payout: PayoutSettings;
  policies: PolicySettings;
}

export interface CommissionSettings {
  defaultRate: number;
  categoryRates: { [categoryId: string]: number };
  vendorTiers: CommissionTier[];
  minimumPayout: number;
}

export interface ApprovalSettings {
  vendorApproval: boolean;
  productApproval: boolean;
  autoApproval: AutoApprovalSettings;
  reviewProcess: ReviewProcessSettings;
}

export interface AutoApprovalSettings {
  enabled: boolean;
  criteria: ApprovalCriteria[];
  exceptions: string[];
}

export interface ApprovalCriteria {
  type: 'vendor_rating' | 'product_quality' | 'category' | 'price_range';
  operator: 'greater_than' | 'less_than' | 'equals' | 'in';
  value: any;
}

export interface ReviewProcessSettings {
  timeframe: number;
  reviewers: string[];
  escalation: EscalationSettings;
}

export interface EscalationSettings {
  enabled: boolean;
  timeframe: number;
  escalateTo: string[];
}

export interface QualitySettings {
  minimumRating: number;
  qualityChecks: QualityCheck[];
  penalties: QualityPenalty[];
}

export interface QualityCheck {
  type: 'automated' | 'manual';
  criteria: string[];
  weight: number;
}

export interface QualityPenalty {
  trigger: string;
  action: 'warning' | 'suspension' | 'removal';
  duration?: number;
}

export interface PayoutSettings {
  schedule: 'weekly' | 'biweekly' | 'monthly';
  minimumAmount: number;
  holdingPeriod: number;
  methods: PayoutMethod[];
}

export interface PayoutMethod {
  type: string;
  fees: PayoutFee[];
  minimumAmount: number;
  processingTime: string;
}

export interface PolicySettings {
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  intellectualProperty: string;
  disputeResolution: string;
}