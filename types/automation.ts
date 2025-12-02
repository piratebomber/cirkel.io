export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: WorkflowVariable[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  executions: WorkflowExecution[];
  analytics: WorkflowAnalytics;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event' | 'condition';
  config: TriggerConfig;
  isActive: boolean;
}

export interface TriggerConfig {
  schedule?: CronSchedule;
  webhook?: WebhookConfig;
  event?: EventConfig;
  condition?: ConditionConfig;
  manual?: ManualConfig;
}

export interface CronSchedule {
  expression: string;
  timezone: string;
  nextRun?: Date;
}

export interface WebhookConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: { [key: string]: string };
  authentication?: WebhookAuth;
}

export interface WebhookAuth {
  type: 'none' | 'basic' | 'bearer' | 'api_key';
  credentials: { [key: string]: string };
}

export interface EventConfig {
  source: string;
  eventType: string;
  filters: EventFilter[];
}

export interface EventFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface ConditionConfig {
  conditions: WorkflowCondition[];
  operator: 'and' | 'or';
  checkInterval: number;
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  source: string;
}

export interface ManualConfig {
  requireApproval: boolean;
  approvers: string[];
  parameters: WorkflowParameter[];
}

export interface WorkflowParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select';
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'parallel' | 'delay' | 'approval';
  config: StepConfig;
  position: { x: number; y: number };
  connections: StepConnection[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
}

export interface StepConfig {
  action?: ActionConfig;
  condition?: ConditionConfig;
  loop?: LoopConfig;
  parallel?: ParallelConfig;
  delay?: DelayConfig;
  approval?: ApprovalConfig;
}

export interface ActionConfig {
  type: string;
  service: string;
  method: string;
  parameters: { [key: string]: any };
  outputMapping: { [key: string]: string };
}

export interface LoopConfig {
  type: 'for_each' | 'while' | 'until';
  collection?: string;
  condition?: WorkflowCondition;
  maxIterations: number;
  steps: WorkflowStep[];
}

export interface ParallelConfig {
  branches: WorkflowBranch[];
  waitForAll: boolean;
  maxConcurrency?: number;
}

export interface WorkflowBranch {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface DelayConfig {
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface ApprovalConfig {
  approvers: string[];
  requireAll: boolean;
  timeout?: number;
  escalation?: EscalationConfig;
}

export interface EscalationConfig {
  after: number;
  to: string[];
  action: 'notify' | 'auto_approve' | 'auto_reject';
}

export interface StepConnection {
  from: string;
  to: string;
  condition?: string;
  label?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  retryOn: string[];
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  scope: 'global' | 'step' | 'execution';
  encrypted: boolean;
}

export interface WorkflowExecution {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  steps: StepExecution[];
  variables: { [key: string]: any };
  error?: ExecutionError;
  triggeredBy: string;
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  input: any;
  output?: any;
  error?: ExecutionError;
  retryCount: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface WorkflowAnalytics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  failureReasons: { [reason: string]: number };
  stepPerformance: { [stepId: string]: StepPerformance };
  executionTrends: ExecutionTrend[];
}

export interface StepPerformance {
  averageDuration: number;
  successRate: number;
  errorRate: number;
  retryRate: number;
}

export interface ExecutionTrend {
  date: Date;
  executions: number;
  successes: number;
  failures: number;
  averageDuration: number;
}

export interface Chatbot {
  id: string;
  name: string;
  description: string;
  avatar: string;
  personality: BotPersonality;
  knowledge: BotKnowledge;
  conversations: BotConversation[];
  analytics: BotAnalytics;
  settings: BotSettings;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface BotPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'formal' | 'humorous';
  style: 'concise' | 'detailed' | 'conversational' | 'technical';
  language: string;
  customPrompts: string[];
  fallbackResponses: string[];
}

export interface BotKnowledge {
  sources: KnowledgeSource[];
  intents: BotIntent[];
  entities: BotEntity[];
  responses: BotResponse[];
  trainingData: TrainingData[];
}

export interface KnowledgeSource {
  id: string;
  type: 'document' | 'url' | 'database' | 'api' | 'manual';
  source: string;
  content?: string;
  lastUpdated: Date;
  isActive: boolean;
}

export interface BotIntent {
  id: string;
  name: string;
  description: string;
  examples: string[];
  responses: string[];
  actions: BotAction[];
  confidence: number;
}

export interface BotEntity {
  id: string;
  name: string;
  type: 'system' | 'custom' | 'regex' | 'list';
  values: EntityValue[];
  patterns?: string[];
}

export interface EntityValue {
  value: string;
  synonyms: string[];
}

export interface BotResponse {
  id: string;
  intentId: string;
  text: string;
  type: 'text' | 'quick_reply' | 'card' | 'carousel' | 'image' | 'video';
  metadata?: ResponseMetadata;
  conditions?: ResponseCondition[];
}

export interface ResponseCondition {
  entity: string;
  operator: 'equals' | 'contains' | 'exists';
  value?: string;
}

export interface BotAction {
  id: string;
  type: 'api_call' | 'database_query' | 'send_email' | 'create_ticket' | 'transfer_human';
  config: ActionConfig;
}

export interface TrainingData {
  id: string;
  input: string;
  intent: string;
  entities: { [entity: string]: string };
  response: string;
  confidence: number;
}

export interface BotConversation {
  id: string;
  userId: string;
  messages: BotMessage[];
  context: ConversationContext;
  status: 'active' | 'resolved' | 'escalated' | 'abandoned';
  startedAt: Date;
  endedAt?: Date;
  satisfaction?: number;
}

export interface BotMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  type: 'text' | 'quick_reply' | 'attachment';
  timestamp: Date;
  intent?: string;
  entities?: { [entity: string]: string };
  confidence?: number;
}

export interface ConversationContext {
  variables: { [key: string]: any };
  currentIntent?: string;
  lastIntent?: string;
  sessionData: { [key: string]: any };
}

export interface BotAnalytics {
  totalConversations: number;
  averageSessionLength: number;
  resolutionRate: number;
  escalationRate: number;
  satisfactionScore: number;
  topIntents: { intent: string; count: number }[];
  failedIntents: { input: string; count: number }[];
  userRetention: number;
}

export interface BotSettings {
  channels: BotChannel[];
  businessHours: BusinessHours;
  handoffRules: HandoffRule[];
  integrations: BotIntegration[];
  nlpSettings: NLPSettings;
}

export interface BotChannel {
  type: 'web' | 'facebook' | 'whatsapp' | 'telegram' | 'slack' | 'discord';
  config: ChannelConfig;
  isActive: boolean;
}

export interface ChannelConfig {
  apiKey?: string;
  webhookUrl?: string;
  accessToken?: string;
  pageId?: string;
  customSettings?: { [key: string]: any };
}

export interface BusinessHours {
  timezone: string;
  schedule: DaySchedule[];
  holidays: Date[];
  outOfHoursMessage: string;
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface HandoffRule {
  id: string;
  name: string;
  conditions: HandoffCondition[];
  action: 'escalate' | 'transfer' | 'notify';
  target: string;
  isActive: boolean;
}

export interface HandoffCondition {
  type: 'intent' | 'keyword' | 'sentiment' | 'conversation_length' | 'user_request';
  value: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface BotIntegration {
  type: 'crm' | 'helpdesk' | 'analytics' | 'payment' | 'calendar';
  config: IntegrationConfig;
  isActive: boolean;
}

export interface IntegrationConfig {
  apiUrl: string;
  apiKey: string;
  mappings: { [field: string]: string };
  syncSettings: SyncSettings;
}

export interface SyncSettings {
  direction: 'inbound' | 'outbound' | 'bidirectional';
  frequency: 'realtime' | 'hourly' | 'daily';
  filters: { [field: string]: any };
}

export interface NLPSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'microsoft' | 'custom';
  model: string;
  confidence: number;
  fallbackThreshold: number;
  contextWindow: number;
  temperature: number;
}

export interface MarketingAutomation {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'social' | 'multi_channel';
  campaign: AutomationCampaign;
  audience: AutomationAudience;
  triggers: AutomationTrigger[];
  sequences: AutomationSequence[];
  analytics: AutomationAnalytics;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdBy: string;
  createdAt: Date;
}

export interface AutomationCampaign {
  id: string;
  name: string;
  objective: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'reactivation';
  budget?: number;
  startDate: Date;
  endDate?: Date;
  tags: string[];
}

export interface AutomationAudience {
  id: string;
  name: string;
  criteria: AudienceCriteria[];
  size: number;
  segments: AudienceSegment[];
  exclusions: AudienceExclusion[];
}

export interface AudienceCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic: 'and' | 'or';
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: AudienceCriteria[];
  size: number;
  percentage: number;
}

export interface AudienceExclusion {
  type: 'unsubscribed' | 'bounced' | 'complained' | 'suppressed' | 'custom';
  criteria?: AudienceCriteria[];
}

export interface AutomationSequence {
  id: string;
  name: string;
  steps: SequenceStep[];
  splitTests: SplitTest[];
  analytics: SequenceAnalytics;
}

export interface SequenceStep {
  id: string;
  type: 'email' | 'sms' | 'push' | 'wait' | 'condition' | 'action';
  config: SequenceStepConfig;
  delay: StepDelay;
  conditions: StepCondition[];
}

export interface SequenceStepConfig {
  template?: MessageTemplate;
  action?: SequenceAction;
  condition?: SequenceCondition;
  wait?: WaitConfig;
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string;
  content: string;
  design: TemplateDesign;
  personalization: PersonalizationRule[];
}

export interface TemplateDesign {
  layout: string;
  colors: { [key: string]: string };
  fonts: { [key: string]: string };
  images: { [key: string]: string };
  customCSS?: string;
}

export interface PersonalizationRule {
  placeholder: string;
  field: string;
  fallback?: string;
  format?: string;
}

export interface SequenceAction {
  type: 'tag' | 'untag' | 'move_list' | 'update_field' | 'webhook' | 'integration';
  config: { [key: string]: any };
}

export interface SequenceCondition {
  field: string;
  operator: string;
  value: any;
  trueStep?: string;
  falseStep?: string;
}

export interface WaitConfig {
  type: 'time' | 'event' | 'condition';
  duration?: number;
  unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  event?: string;
  condition?: SequenceCondition;
}

export interface StepDelay {
  type: 'immediate' | 'scheduled' | 'optimal';
  value?: number;
  unit?: 'minutes' | 'hours' | 'days';
  time?: string;
  timezone?: string;
}

export interface StepCondition {
  type: 'engagement' | 'behavior' | 'attribute' | 'time';
  config: { [key: string]: any };
}

export interface SplitTest {
  id: string;
  name: string;
  type: 'subject' | 'content' | 'send_time' | 'sender';
  variants: TestVariant[];
  trafficSplit: number[];
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate' | 'revenue';
  duration: number;
  status: 'running' | 'completed' | 'paused';
}

export interface TestVariant {
  id: string;
  name: string;
  template: MessageTemplate;
  percentage: number;
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
}

export interface SequenceAnalytics {
  totalRecipients: number;
  completionRate: number;
  dropoffPoints: { stepId: string; percentage: number }[];
  performance: { stepId: string; metrics: StepMetrics }[];
}

export interface StepMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  bounced: number;
}

export interface AutomationAnalytics {
  overview: AutomationOverview;
  performance: AutomationPerformance;
  audience: AutomationAudienceAnalytics;
  revenue: AutomationRevenue;
  trends: AutomationTrend[];
}

export interface AutomationOverview {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  bounceRate: number;
}

export interface AutomationPerformance {
  bestPerformingSequence: string;
  worstPerformingSequence: string;
  topPerformingContent: string[];
  optimalSendTimes: { [day: string]: string };
}

export interface AutomationAudienceAnalytics {
  segmentPerformance: { [segmentId: string]: SegmentPerformance };
  engagementByDemographic: { [demographic: string]: { [value: string]: number } };
  behaviorPatterns: BehaviorPattern[];
}

export interface SegmentPerformance {
  size: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

export interface AutomationRevenue {
  total: number;
  perRecipient: number;
  perSequence: { [sequenceId: string]: number };
  attribution: RevenueAttribution[];
}

export interface RevenueAttribution {
  source: string;
  amount: number;
  percentage: number;
}

export interface AutomationTrend {
  date: Date;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  revenue: number;
}

export interface CustomerJourney {
  id: string;
  name: string;
  description: string;
  stages: JourneyStage[];
  touchpoints: JourneyTouchpoint[];
  personas: CustomerPersona[];
  analytics: JourneyAnalytics;
  optimizations: JourneyOptimization[];
  createdBy: string;
  createdAt: Date;
}

export interface JourneyStage {
  id: string;
  name: string;
  description: string;
  objectives: string[];
  kpis: JourneyKPI[];
  duration: StageDuration;
  actions: StageAction[];
  barriers: StageBarrier[];
}

export interface JourneyKPI {
  name: string;
  target: number;
  current: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface StageDuration {
  average: number;
  median: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  distribution: { [range: string]: number };
}

export interface StageAction {
  id: string;
  type: 'content' | 'email' | 'call' | 'meeting' | 'demo' | 'trial';
  name: string;
  description: string;
  trigger: ActionTrigger;
  success: ActionSuccess;
}

export interface ActionTrigger {
  type: 'time' | 'behavior' | 'score' | 'manual';
  config: { [key: string]: any };
}

export interface ActionSuccess {
  criteria: SuccessCriteria[];
  nextStage?: string;
  alternatives: AlternativeAction[];
}

export interface SuccessCriteria {
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than';
  value: number;
}

export interface AlternativeAction {
  condition: string;
  action: string;
  nextStage?: string;
}

export interface StageBarrier {
  id: string;
  name: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  frequency: number;
  solutions: BarrierSolution[];
}

export interface BarrierSolution {
  description: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'proposed' | 'in_progress' | 'implemented';
}

export interface JourneyTouchpoint {
  id: string;
  name: string;
  type: 'website' | 'email' | 'social' | 'phone' | 'chat' | 'store' | 'app';
  channel: string;
  stage: string;
  interactions: TouchpointInteraction[];
  satisfaction: TouchpointSatisfaction;
  optimization: TouchpointOptimization;
}

export interface TouchpointInteraction {
  id: string;
  type: string;
  frequency: number;
  duration: number;
  satisfaction: number;
  conversion: number;
}

export interface TouchpointSatisfaction {
  score: number;
  feedback: TouchpointFeedback[];
  nps: number;
  csat: number;
}

export interface TouchpointFeedback {
  rating: number;
  comment: string;
  category: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

export interface TouchpointOptimization {
  opportunities: OptimizationOpportunity[];
  experiments: TouchpointExperiment[];
  improvements: TouchpointImprovement[];
}

export interface OptimizationOpportunity {
  area: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export interface TouchpointExperiment {
  id: string;
  name: string;
  hypothesis: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'running' | 'completed';
  results?: ExperimentResults;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  changes: VariantChange[];
  traffic: number;
}

export interface ExperimentResults {
  winner: string;
  confidence: number;
  lift: number;
  significance: boolean;
}

export interface TouchpointImprovement {
  id: string;
  description: string;
  impact: number;
  implementedAt: Date;
  measuredImpact?: number;
}

export interface CustomerPersona {
  id: string;
  name: string;
  description: string;
  demographics: PersonaDemographics;
  psychographics: PersonaPsychographics;
  behaviors: PersonaBehavior[];
  goals: PersonaGoal[];
  painPoints: PersonaPainPoint[];
  journey: PersonaJourney;
}

export interface PersonaDemographics {
  age: { min: number; max: number };
  gender: string[];
  income: { min: number; max: number };
  education: string[];
  location: string[];
  occupation: string[];
}

export interface PersonaPsychographics {
  values: string[];
  interests: string[];
  lifestyle: string[];
  personality: string[];
  attitudes: string[];
}

export interface PersonaBehavior {
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  channels: string[];
}

export interface PersonaGoal {
  category: 'functional' | 'emotional' | 'social';
  description: string;
  priority: 'high' | 'medium' | 'low';
  metrics: string[];
}

export interface PersonaPainPoint {
  category: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  frequency: 'always' | 'often' | 'sometimes' | 'rarely';
  solutions: string[];
}

export interface PersonaJourney {
  stages: PersonaStage[];
  touchpoints: string[];
  emotions: PersonaEmotion[];
  decisions: PersonaDecision[];
}

export interface PersonaStage {
  stageId: string;
  behaviors: string[];
  thoughts: string[];
  emotions: string[];
  actions: string[];
}

export interface PersonaEmotion {
  stage: string;
  emotion: string;
  intensity: number;
  triggers: string[];
}

export interface PersonaDecision {
  stage: string;
  decision: string;
  factors: DecisionFactor[];
  influences: string[];
}

export interface DecisionFactor {
  factor: string;
  weight: number;
  type: 'rational' | 'emotional' | 'social';
}

export interface JourneyAnalytics {
  overview: JourneyOverview;
  stageAnalytics: { [stageId: string]: StageAnalytics };
  conversionFunnels: ConversionFunnel[];
  cohortAnalysis: CohortAnalysis;
  attribution: JourneyAttribution;
}

export interface JourneyOverview {
  totalCustomers: number;
  averageJourneyTime: number;
  completionRate: number;
  dropoffRate: number;
  satisfactionScore: number;
  nps: number;
}

export interface StageAnalytics {
  entryCount: number;
  exitCount: number;
  conversionRate: number;
  averageTime: number;
  satisfaction: number;
  topActions: { action: string; count: number }[];
}

export interface ConversionFunnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  conversionRates: number[];
  dropoffReasons: { [stage: string]: DropoffReason[] };
}

export interface FunnelStage {
  id: string;
  name: string;
  count: number;
  conversionRate: number;
}

export interface DropoffReason {
  reason: string;
  percentage: number;
  impact: 'high' | 'medium' | 'low';
}

export interface CohortAnalysis {
  cohorts: CustomerCohort[];
  retentionRates: { [period: string]: number[] };
  revenueAnalysis: CohortRevenue[];
}

export interface CustomerCohort {
  id: string;
  name: string;
  startDate: Date;
  size: number;
  characteristics: { [key: string]: any };
}

export interface CohortRevenue {
  cohortId: string;
  periods: { period: number; revenue: number; customers: number }[];
  ltv: number;
}

export interface JourneyAttribution {
  touchpointContribution: { [touchpoint: string]: number };
  channelAttribution: { [channel: string]: number };
  campaignAttribution: { [campaign: string]: number };
  modelType: 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';
}

export interface JourneyOptimization {
  id: string;
  type: 'stage' | 'touchpoint' | 'persona' | 'overall';
  target: string;
  description: string;
  hypothesis: string;
  implementation: OptimizationImplementation;
  results: OptimizationResults;
  status: 'proposed' | 'testing' | 'implemented' | 'rejected';
}

export interface OptimizationImplementation {
  changes: OptimizationChange[];
  timeline: OptimizationTimeline;
  resources: OptimizationResource[];
  risks: OptimizationRisk[];
}

export interface OptimizationChange {
  area: string;
  description: string;
  type: 'content' | 'process' | 'technology' | 'design';
  effort: 'low' | 'medium' | 'high';
}

export interface OptimizationTimeline {
  phases: OptimizationPhase[];
  totalDuration: number;
  milestones: OptimizationMilestone[];
}

export interface OptimizationPhase {
  name: string;
  duration: number;
  activities: string[];
  dependencies: string[];
}

export interface OptimizationMilestone {
  name: string;
  date: Date;
  criteria: string[];
  status: 'pending' | 'completed' | 'delayed';
}

export interface OptimizationResource {
  type: 'human' | 'technology' | 'budget';
  description: string;
  quantity: number;
  cost?: number;
}

export interface OptimizationRisk {
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface OptimizationResults {
  metrics: OptimizationMetric[];
  impact: OptimizationImpact;
  learnings: string[];
  nextSteps: string[];
}

export interface OptimizationMetric {
  name: string;
  before: number;
  after: number;
  change: number;
  significance: boolean;
}

export interface OptimizationImpact {
  revenue: number;
  conversion: number;
  satisfaction: number;
  efficiency: number;
  roi: number;
}