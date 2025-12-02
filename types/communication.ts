export interface SpatialAudioRoom {
  id: string;
  name: string;
  description: string;
  type: 'conference' | 'social' | 'gaming' | 'meditation' | 'music' | 'education';
  capacity: number;
  participants: SpatialParticipant[];
  environment: SpatialEnvironment;
  audio: SpatialAudioConfig;
  permissions: RoomPermissions;
  recording: RoomRecording;
  analytics: RoomAnalytics;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface SpatialParticipant {
  id: string;
  userId: string;
  position: Vector3D;
  orientation: Vector3D;
  avatar: SpatialAvatar;
  audio: ParticipantAudio;
  permissions: ParticipantPermissions;
  status: 'active' | 'muted' | 'away' | 'disconnected';
  joinedAt: Date;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SpatialAvatar {
  id: string;
  model: string;
  texture: string;
  animations: AvatarAnimation[];
  accessories: AvatarAccessory[];
  scale: number;
  visibility: 'visible' | 'transparent' | 'hidden';
}

export interface AvatarAnimation {
  id: string;
  name: string;
  type: 'idle' | 'talking' | 'gesture' | 'emotion' | 'custom';
  url: string;
  duration: number;
  loop: boolean;
  trigger: AnimationTrigger;
}

export interface AnimationTrigger {
  type: 'manual' | 'voice_activity' | 'emotion' | 'proximity' | 'time';
  config: { [key: string]: any };
}

export interface AvatarAccessory {
  id: string;
  name: string;
  type: 'hat' | 'glasses' | 'clothing' | 'prop' | 'effect';
  model: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
}

export interface ParticipantAudio {
  volume: number;
  isMuted: boolean;
  isSpeaking: boolean;
  voiceActivity: number;
  spatialSettings: SpatialAudioSettings;
  effects: AudioEffect[];
  quality: AudioQuality;
}

export interface SpatialAudioSettings {
  enabled: boolean;
  falloffDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  dopplerEffect: boolean;
  occlusionEnabled: boolean;
  reverbEnabled: boolean;
}

export interface AudioEffect {
  id: string;
  type: 'reverb' | 'echo' | 'distortion' | 'pitch_shift' | 'noise_gate' | 'compressor';
  parameters: { [key: string]: number };
  isActive: boolean;
}

export interface AudioQuality {
  sampleRate: number;
  bitrate: number;
  channels: number;
  codec: 'opus' | 'aac' | 'mp3' | 'pcm';
  latency: number;
  packetLoss: number;
}

export interface ParticipantPermissions {
  canSpeak: boolean;
  canMove: boolean;
  canInvite: boolean;
  canModerate: boolean;
  canRecord: boolean;
  canShareScreen: boolean;
  canControlEnvironment: boolean;
}

export interface SpatialEnvironment {
  id: string;
  name: string;
  type: '3d_model' | 'skybox' | 'procedural' | 'video_360';
  assets: EnvironmentAsset[];
  lighting: EnvironmentLighting;
  physics: PhysicsSettings;
  acoustics: AcousticSettings;
  weather: WeatherSettings;
  interactables: InteractableObject[];
}

export interface EnvironmentAsset {
  id: string;
  type: 'model' | 'texture' | 'audio' | 'particle' | 'animation';
  url: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  properties: { [key: string]: any };
}

export interface EnvironmentLighting {
  type: 'directional' | 'point' | 'spot' | 'ambient' | 'hdri';
  color: string;
  intensity: number;
  position?: Vector3D;
  direction?: Vector3D;
  shadows: boolean;
  softShadows: boolean;
}

export interface PhysicsSettings {
  enabled: boolean;
  gravity: Vector3D;
  collisionDetection: boolean;
  rigidBodies: RigidBody[];
}

export interface RigidBody {
  id: string;
  type: 'static' | 'dynamic' | 'kinematic';
  shape: 'box' | 'sphere' | 'capsule' | 'mesh';
  mass: number;
  friction: number;
  restitution: number;
}

export interface AcousticSettings {
  reverberation: ReverbSettings;
  absorption: AbsorptionSettings;
  reflection: ReflectionSettings;
  occlusion: OcclusionSettings;
}

export interface ReverbSettings {
  enabled: boolean;
  roomSize: number;
  damping: number;
  wetLevel: number;
  dryLevel: number;
  preDelay: number;
}

export interface AbsorptionSettings {
  materials: MaterialAcoustics[];
  frequency: FrequencyResponse;
}

export interface MaterialAcoustics {
  material: string;
  absorption: number;
  scattering: number;
}

export interface FrequencyResponse {
  low: number;
  mid: number;
  high: number;
}

export interface ReflectionSettings {
  enabled: boolean;
  surfaces: ReflectiveSurface[];
  maxReflections: number;
}

export interface ReflectiveSurface {
  id: string;
  position: Vector3D;
  normal: Vector3D;
  reflectivity: number;
  size: Vector3D;
}

export interface OcclusionSettings {
  enabled: boolean;
  rayTracing: boolean;
  occluders: Occluder[];
}

export interface Occluder {
  id: string;
  geometry: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  occlusionFactor: number;
}

export interface WeatherSettings {
  enabled: boolean;
  type: 'clear' | 'rain' | 'snow' | 'fog' | 'storm' | 'wind';
  intensity: number;
  particles: WeatherParticle[];
  sounds: WeatherSound[];
}

export interface WeatherParticle {
  type: string;
  count: number;
  size: number;
  speed: number;
  direction: Vector3D;
  color: string;
  opacity: number;
}

export interface WeatherSound {
  type: string;
  url: string;
  volume: number;
  loop: boolean;
  spatial: boolean;
}

export interface InteractableObject {
  id: string;
  name: string;
  type: 'button' | 'lever' | 'door' | 'teleporter' | 'media_player' | 'whiteboard';
  position: Vector3D;
  model: string;
  interactions: ObjectInteraction[];
  state: { [key: string]: any };
  permissions: InteractionPermissions;
}

export interface ObjectInteraction {
  id: string;
  type: 'click' | 'proximity' | 'voice' | 'gesture';
  trigger: InteractionTrigger;
  action: InteractionAction;
  feedback: InteractionFeedback;
}

export interface InteractionTrigger {
  type: string;
  conditions: { [key: string]: any };
  cooldown: number;
}

export interface InteractionAction {
  type: 'state_change' | 'teleport' | 'play_media' | 'send_message' | 'trigger_event';
  parameters: { [key: string]: any };
}

export interface InteractionFeedback {
  visual: VisualFeedback;
  audio: AudioFeedback;
  haptic: HapticFeedback;
}

export interface VisualFeedback {
  type: 'highlight' | 'animation' | 'particle' | 'ui_popup';
  duration: number;
  parameters: { [key: string]: any };
}

export interface AudioFeedback {
  sound: string;
  volume: number;
  spatial: boolean;
}

export interface HapticFeedback {
  enabled: boolean;
  pattern: 'click' | 'buzz' | 'pulse' | 'custom';
  intensity: number;
  duration: number;
}

export interface InteractionPermissions {
  allowedUsers: string[];
  allowedRoles: string[];
  requiresPermission: boolean;
}

export interface SpatialAudioConfig {
  engine: 'web_audio' | 'resonance' | 'steam_audio' | 'oculus_audio';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  spatialAlgorithm: 'hrtf' | 'binaural' | 'ambisonics' | 'object_based';
  compression: AudioCompression;
  noiseReduction: NoiseReduction;
  echoCancellation: EchoCancellation;
}

export interface AudioCompression {
  enabled: boolean;
  codec: string;
  bitrate: number;
  adaptiveBitrate: boolean;
}

export interface NoiseReduction {
  enabled: boolean;
  algorithm: 'spectral_subtraction' | 'wiener_filter' | 'rnn' | 'transformer';
  aggressiveness: number;
}

export interface EchoCancellation {
  enabled: boolean;
  algorithm: 'nlms' | 'rls' | 'kalman' | 'neural';
  adaptationRate: number;
}

export interface RoomPermissions {
  isPublic: boolean;
  requiresInvite: boolean;
  allowGuests: boolean;
  maxParticipants: number;
  moderators: string[];
  bannedUsers: string[];
  allowedDomains: string[];
}

export interface RoomRecording {
  enabled: boolean;
  autoRecord: boolean;
  format: 'mp4' | 'webm' | 'spatial_audio';
  quality: 'low' | 'medium' | 'high' | '4k';
  includeVideo: boolean;
  includeAudio: boolean;
  includeSpatialData: boolean;
  recordings: Recording[];
}

export interface Recording {
  id: string;
  name: string;
  duration: number;
  size: number;
  format: string;
  url: string;
  thumbnail?: string;
  participants: string[];
  startedAt: Date;
  endedAt: Date;
  isProcessing: boolean;
}

export interface RoomAnalytics {
  totalSessions: number;
  totalDuration: number;
  averageSessionLength: number;
  peakParticipants: number;
  participantEngagement: EngagementMetrics;
  audioQuality: QualityMetrics;
  spatialMovement: MovementMetrics;
  interactionStats: InteractionStats;
}

export interface EngagementMetrics {
  averageSpeakingTime: number;
  silencePercentage: number;
  movementActivity: number;
  interactionCount: number;
  sessionRetention: number;
}

export interface QualityMetrics {
  averageLatency: number;
  packetLoss: number;
  jitter: number;
  audioDropouts: number;
  reconnections: number;
}

export interface MovementMetrics {
  totalDistance: number;
  averageSpeed: number;
  hotspots: Hotspot[];
  pathAnalysis: PathData[];
}

export interface Hotspot {
  position: Vector3D;
  visits: number;
  averageDuration: number;
  radius: number;
}

export interface PathData {
  from: Vector3D;
  to: Vector3D;
  frequency: number;
  averageTime: number;
}

export interface InteractionStats {
  totalInteractions: number;
  interactionsByType: { [type: string]: number };
  popularObjects: { objectId: string; interactions: number }[];
  interactionHeatmap: InteractionHeatmap[];
}

export interface InteractionHeatmap {
  position: Vector3D;
  interactions: number;
  radius: number;
}

export interface HolographicCall {
  id: string;
  participants: HolographicParticipant[];
  type: 'one_on_one' | 'group' | 'conference' | 'presentation';
  status: 'connecting' | 'active' | 'paused' | 'ended';
  hologram: HologramConfig;
  ar: ARIntegration;
  quality: HolographicQuality;
  recording: HolographicRecording;
  startedAt: Date;
  endedAt?: Date;
}

export interface HolographicParticipant {
  id: string;
  userId: string;
  hologram: ParticipantHologram;
  camera: CameraSetup;
  display: DisplaySetup;
  tracking: MotionTracking;
  audio: HolographicAudio;
  status: 'connected' | 'projecting' | 'viewing' | 'disconnected';
}

export interface ParticipantHologram {
  model: HologramModel;
  position: Vector3D;
  scale: Vector3D;
  opacity: number;
  quality: 'low' | 'medium' | 'high' | 'photorealistic';
  compression: HologramCompression;
  lighting: HologramLighting;
}

export interface HologramModel {
  type: 'point_cloud' | 'mesh' | 'volumetric' | 'neural_radiance';
  resolution: { width: number; height: number; depth: number };
  frameRate: number;
  colorDepth: number;
  hasTexture: boolean;
  hasNormals: boolean;
}

export interface HologramCompression {
  algorithm: 'h264' | 'h265' | 'av1' | 'draco' | 'custom';
  bitrate: number;
  keyFrameInterval: number;
  lossless: boolean;
}

export interface HologramLighting {
  enabled: boolean;
  environmentMapping: boolean;
  shadowCasting: boolean;
  shadowReceiving: boolean;
  lightProbes: LightProbe[];
}

export interface LightProbe {
  position: Vector3D;
  intensity: number;
  color: string;
  type: 'directional' | 'point' | 'spot';
}

export interface CameraSetup {
  cameras: Camera3D[];
  calibration: CameraCalibration;
  synchronization: CameraSynchronization;
  depthSensing: DepthSensing;
}

export interface Camera3D {
  id: string;
  type: 'rgb' | 'depth' | 'infrared' | 'lidar';
  position: Vector3D;
  orientation: Vector3D;
  fieldOfView: number;
  resolution: { width: number; height: number };
  frameRate: number;
  exposure: CameraExposure;
}

export interface CameraExposure {
  auto: boolean;
  iso: number;
  shutterSpeed: number;
  aperture: number;
  whiteBalance: number;
}

export interface CameraCalibration {
  intrinsicMatrix: number[][];
  distortionCoefficients: number[];
  extrinsicMatrix: number[][];
  reprojectionError: number;
  calibratedAt: Date;
}

export interface CameraSynchronization {
  method: 'hardware' | 'software' | 'genlock';
  accuracy: number;
  latency: number;
  jitter: number;
}

export interface DepthSensing {
  enabled: boolean;
  technology: 'stereo' | 'structured_light' | 'time_of_flight' | 'lidar';
  range: { min: number; max: number };
  accuracy: number;
  resolution: { width: number; height: number };
}

export interface DisplaySetup {
  type: 'ar_headset' | 'holographic_display' | 'projection' | 'screen';
  resolution: { width: number; height: number };
  refreshRate: number;
  fieldOfView: number;
  brightness: number;
  contrast: number;
  colorGamut: string;
  tracking: DisplayTracking;
}

export interface DisplayTracking {
  headTracking: boolean;
  eyeTracking: boolean;
  handTracking: boolean;
  bodyTracking: boolean;
  accuracy: number;
  latency: number;
}

export interface MotionTracking {
  head: HeadTracking;
  eyes: EyeTracking;
  hands: HandTracking;
  body: BodyTracking;
  face: FaceTracking;
}

export interface HeadTracking {
  enabled: boolean;
  position: Vector3D;
  rotation: Vector3D;
  velocity: Vector3D;
  acceleration: Vector3D;
  confidence: number;
}

export interface EyeTracking {
  enabled: boolean;
  leftEye: EyeData;
  rightEye: EyeData;
  gazeDirection: Vector3D;
  gazeTarget: Vector3D;
  blinkRate: number;
  pupilDilation: number;
}

export interface EyeData {
  position: Vector3D;
  rotation: Vector3D;
  openness: number;
  pupilSize: number;
  confidence: number;
}

export interface HandTracking {
  enabled: boolean;
  leftHand: HandData;
  rightHand: HandData;
  gestures: GestureRecognition;
}

export interface HandData {
  position: Vector3D;
  rotation: Vector3D;
  fingers: FingerData[];
  confidence: number;
  isVisible: boolean;
}

export interface FingerData {
  type: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
  joints: JointData[];
  bend: number;
  spread: number;
}

export interface JointData {
  position: Vector3D;
  rotation: Vector3D;
  confidence: number;
}

export interface GestureRecognition {
  enabled: boolean;
  recognizedGestures: RecognizedGesture[];
  customGestures: CustomGesture[];
}

export interface RecognizedGesture {
  type: string;
  confidence: number;
  timestamp: Date;
  duration: number;
}

export interface CustomGesture {
  id: string;
  name: string;
  pattern: GesturePattern;
  action: GestureAction;
}

export interface GesturePattern {
  keyframes: GestureKeyframe[];
  tolerance: number;
  minDuration: number;
  maxDuration: number;
}

export interface GestureKeyframe {
  timestamp: number;
  handPose: HandPose;
  weight: number;
}

export interface HandPose {
  position: Vector3D;
  rotation: Vector3D;
  fingerPositions: Vector3D[];
}

export interface GestureAction {
  type: 'ui_interaction' | 'object_manipulation' | 'navigation' | 'communication';
  parameters: { [key: string]: any };
}

export interface BodyTracking {
  enabled: boolean;
  skeleton: SkeletonData;
  pose: PoseData;
  movement: MovementData;
}

export interface SkeletonData {
  joints: BodyJoint[];
  bones: BoneData[];
  confidence: number;
}

export interface BodyJoint {
  type: string;
  position: Vector3D;
  rotation: Vector3D;
  confidence: number;
}

export interface BoneData {
  from: string;
  to: string;
  length: number;
  rotation: Vector3D;
}

export interface PoseData {
  standing: boolean;
  sitting: boolean;
  walking: boolean;
  running: boolean;
  gesturing: boolean;
  confidence: number;
}

export interface MovementData {
  velocity: Vector3D;
  acceleration: Vector3D;
  direction: Vector3D;
  speed: number;
}

export interface FaceTracking {
  enabled: boolean;
  landmarks: FaceLandmark[];
  expressions: FacialExpression[];
  emotions: EmotionData[];
  lipSync: LipSyncData;
}

export interface FaceLandmark {
  id: string;
  position: Vector3D;
  confidence: number;
}

export interface FacialExpression {
  type: string;
  intensity: number;
  confidence: number;
}

export interface EmotionData {
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'disgust' | 'neutral';
  confidence: number;
  intensity: number;
}

export interface LipSyncData {
  phonemes: PhonemeData[];
  mouthShape: MouthShape;
  speechIntensity: number;
}

export interface PhonemeData {
  phoneme: string;
  timestamp: number;
  duration: number;
  confidence: number;
}

export interface MouthShape {
  openness: number;
  width: number;
  lipPosition: Vector3D;
}

export interface HolographicAudio {
  spatial: boolean;
  binaural: boolean;
  roomCorrection: boolean;
  personalization: AudioPersonalization;
  processing: AudioProcessing;
}

export interface AudioPersonalization {
  enabled: boolean;
  hearingProfile: HearingProfile;
  preferences: AudioPreferences;
}

export interface HearingProfile {
  frequencyResponse: FrequencyResponse;
  hearingLoss: HearingLossData[];
  spatialAccuracy: number;
}

export interface HearingLossData {
  frequency: number;
  loss: number;
  ear: 'left' | 'right' | 'both';
}

export interface AudioPreferences {
  bassBoost: number;
  trebleBoost: number;
  spatialWidth: number;
  roomSize: 'small' | 'medium' | 'large' | 'custom';
}

export interface AudioProcessing {
  latency: number;
  bufferSize: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  effects: AudioEffect[];
}

export interface HolographicQuality {
  overall: 'low' | 'medium' | 'high' | 'ultra';
  visual: VisualQuality;
  audio: AudioQuality;
  tracking: TrackingQuality;
  latency: LatencyMetrics;
}

export interface VisualQuality {
  resolution: { width: number; height: number; depth: number };
  frameRate: number;
  bitrate: number;
  compression: string;
  artifacts: QualityArtifacts;
}

export interface QualityArtifacts {
  blockiness: number;
  blurriness: number;
  flickering: number;
  ghosting: number;
  latency: number;
}

export interface TrackingQuality {
  accuracy: number;
  precision: number;
  stability: number;
  latency: number;
  dropouts: number;
}

export interface LatencyMetrics {
  endToEnd: number;
  capture: number;
  encoding: number;
  transmission: number;
  decoding: number;
  rendering: number;
  display: number;
}

export interface HolographicRecording {
  enabled: boolean;
  format: 'volumetric' | 'point_cloud' | 'mesh_sequence' | 'neural_radiance';
  quality: 'preview' | 'standard' | 'high' | 'archival';
  compression: HologramCompression;
  metadata: RecordingMetadata;
  storage: StorageConfig;
}

export interface RecordingMetadata {
  participants: string[];
  duration: number;
  fileSize: number;
  cameras: CameraMetadata[];
  lighting: LightingMetadata;
  environment: EnvironmentMetadata;
}

export interface CameraMetadata {
  cameraId: string;
  position: Vector3D;
  orientation: Vector3D;
  settings: CameraSettings;
}

export interface CameraSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  exposure: CameraExposure;
  focus: FocusSettings;
}

export interface FocusSettings {
  mode: 'auto' | 'manual' | 'tracking';
  distance: number;
  aperture: number;
}

export interface LightingMetadata {
  lights: LightSource[];
  ambientLight: AmbientLightData;
  shadows: ShadowSettings;
}

export interface LightSource {
  type: 'directional' | 'point' | 'spot' | 'area';
  position: Vector3D;
  direction: Vector3D;
  intensity: number;
  color: string;
  temperature: number;
}

export interface AmbientLightData {
  intensity: number;
  color: string;
  source: 'natural' | 'artificial' | 'mixed';
}

export interface ShadowSettings {
  enabled: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  softness: number;
  bias: number;
}

export interface EnvironmentMetadata {
  location: string;
  time: Date;
  weather: WeatherConditions;
  acoustics: AcousticProperties;
}

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
}

export interface AcousticProperties {
  reverbTime: number;
  absorption: number;
  reflection: number;
  backgroundNoise: number;
}

export interface StorageConfig {
  location: 'local' | 'cloud' | 'hybrid';
  encryption: boolean;
  compression: boolean;
  redundancy: number;
  retention: number;
}

export interface ARIntegration {
  enabled: boolean;
  platform: 'arcore' | 'arkit' | 'hololens' | 'magic_leap' | 'web_xr';
  features: ARFeature[];
  tracking: ARTracking;
  rendering: ARRendering;
  interaction: ARInteraction;
}

export interface ARFeature {
  type: 'plane_detection' | 'object_tracking' | 'face_tracking' | 'hand_tracking' | 'occlusion';
  enabled: boolean;
  config: { [key: string]: any };
}

export interface ARTracking {
  worldTracking: boolean;
  planeDetection: PlaneDetection;
  lightEstimation: LightEstimation;
  occlusionMapping: OcclusionMapping;
}

export interface PlaneDetection {
  horizontal: boolean;
  vertical: boolean;
  arbitrary: boolean;
  minSize: number;
  maxDistance: number;
}

export interface LightEstimation {
  enabled: boolean;
  ambientIntensity: boolean;
  ambientColor: boolean;
  directionalLight: boolean;
  environmentTexture: boolean;
}

export interface OcclusionMapping {
  enabled: boolean;
  resolution: { width: number; height: number };
  updateRate: number;
  accuracy: number;
}

export interface ARRendering {
  renderPipeline: 'forward' | 'deferred' | 'tile_based';
  antiAliasing: 'none' | 'fxaa' | 'msaa' | 'taa';
  shadows: boolean;
  reflections: boolean;
  globalIllumination: boolean;
  postProcessing: PostProcessingEffect[];
}

export interface PostProcessingEffect {
  type: 'bloom' | 'tone_mapping' | 'color_grading' | 'depth_of_field' | 'motion_blur';
  enabled: boolean;
  parameters: { [key: string]: number };
}

export interface ARInteraction {
  touchGestures: boolean;
  airTap: boolean;
  gazeInteraction: boolean;
  voiceCommands: boolean;
  handGestures: boolean;
  controllers: ControllerSupport[];
}

export interface ControllerSupport {
  type: 'gamepad' | 'motion_controller' | 'hand_controller' | 'eye_tracker';
  supported: boolean;
  mappings: ControllerMapping[];
}

export interface ControllerMapping {
  input: string;
  action: string;
  parameters: { [key: string]: any };
}

export interface CollaborativeWorkspace {
  id: string;
  name: string;
  type: 'document' | 'whiteboard' | 'design' | 'code' | 'presentation' | 'brainstorm';
  participants: WorkspaceParticipant[];
  content: WorkspaceContent;
  tools: CollaborationTool[];
  permissions: WorkspacePermissions;
  history: WorkspaceHistory[];
  realtime: RealtimeSync;
  ai: WorkspaceAI;
  analytics: WorkspaceAnalytics;
  createdBy: string;
  createdAt: Date;
}

export interface WorkspaceParticipant {
  id: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  cursor: ParticipantCursor;
  selection: ParticipantSelection;
  presence: ParticipantPresence;
  permissions: ParticipantWorkspacePermissions;
  joinedAt: Date;
}

export interface ParticipantCursor {
  position: { x: number; y: number };
  color: string;
  visible: boolean;
  tool: string;
  lastUpdate: Date;
}

export interface ParticipantSelection {
  elements: string[];
  range?: TextRange;
  color: string;
  timestamp: Date;
}

export interface TextRange {
  start: number;
  end: number;
  text: string;
}

export interface ParticipantPresence {
  status: 'active' | 'idle' | 'away' | 'offline';
  lastSeen: Date;
  currentView: ViewState;
  activity: ActivityState;
}

export interface ViewState {
  zoom: number;
  pan: { x: number; y: number };
  viewport: { width: number; height: number };
  focus: string;
}

export interface ActivityState {
  typing: boolean;
  drawing: boolean;
  selecting: boolean;
  commenting: boolean;
  presenting: boolean;
}

export interface ParticipantWorkspacePermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canExport: boolean;
  canManagePermissions: boolean;
  canUseAI: boolean;
  canRecord: boolean;
}

export interface WorkspaceContent {
  type: string;
  data: any;
  elements: WorkspaceElement[];
  layers: ContentLayer[];
  metadata: ContentMetadata;
  version: number;
}

export interface WorkspaceElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'video' | 'audio' | 'link' | 'embed' | 'code' | 'chart';
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number };
  rotation: number;
  properties: ElementProperties;
  style: ElementStyle;
  interactions: ElementInteraction[];
  comments: ElementComment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ElementProperties {
  content?: string;
  url?: string;
  source?: string;
  data?: any;
  settings?: { [key: string]: any };
}

export interface ElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  borderRadius?: number;
  shadow?: ShadowStyle;
  gradient?: GradientStyle;
}

export interface ShadowStyle {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
}

export interface GradientStyle {
  type: 'linear' | 'radial' | 'conic';
  stops: GradientStop[];
  angle?: number;
  center?: { x: number; y: number };
}

export interface GradientStop {
  offset: number;
  color: string;
}

export interface ElementInteraction {
  type: 'click' | 'hover' | 'drag' | 'resize' | 'rotate';
  action: 'navigate' | 'animate' | 'show_hide' | 'play_media' | 'trigger_event';
  parameters: { [key: string]: any };
}

export interface ElementComment {
  id: string;
  userId: string;
  content: string;
  position: { x: number; y: number };
  resolved: boolean;
  replies: CommentReply[];
  createdAt: Date;
}

export interface CommentReply {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface ContentLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  elements: string[];
  order: number;
}

export interface ContentMetadata {
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  lastModified: Date;
  fileSize: number;
  dimensions: { width: number; height: number };
}

export interface CollaborationTool {
  id: string;
  name: string;
  type: 'drawing' | 'text' | 'shape' | 'selection' | 'comment' | 'presentation' | 'ai';
  icon: string;
  shortcuts: KeyboardShortcut[];
  settings: ToolSettings;
  isActive: boolean;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
}

export interface ToolSettings {
  brush?: BrushSettings;
  text?: TextSettings;
  shape?: ShapeSettings;
  selection?: SelectionSettings;
}

export interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
  hardness: number;
  spacing: number;
  pressure: boolean;
  tilt: boolean;
}

export interface TextSettings {
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
}

export interface ShapeSettings {
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  opacity: number;
}

export interface SelectionSettings {
  mode: 'rectangle' | 'lasso' | 'magic_wand';
  tolerance: number;
  feather: number;
  antiAlias: boolean;
}

export interface WorkspacePermissions {
  visibility: 'private' | 'team' | 'organization' | 'public';
  allowGuests: boolean;
  requireApproval: boolean;
  defaultRole: 'viewer' | 'commenter' | 'editor';
  expiration?: Date;
  passwordProtected: boolean;
  downloadable: boolean;
}

export interface WorkspaceHistory {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'style' | 'comment' | 'permission';
  elementId?: string;
  userId: string;
  changes: HistoryChange[];
  timestamp: Date;
  canUndo: boolean;
  canRedo: boolean;
}

export interface HistoryChange {
  property: string;
  oldValue: any;
  newValue: any;
  path?: string;
}

export interface RealtimeSync {
  enabled: boolean;
  protocol: 'websocket' | 'webrtc' | 'sse';
  conflictResolution: 'last_write_wins' | 'operational_transform' | 'crdt';
  syncFrequency: number;
  batchUpdates: boolean;
  compression: boolean;
}

export interface WorkspaceAI {
  enabled: boolean;
  features: AIFeature[];
  suggestions: AISuggestion[];
  automation: AIAutomation[];
  analytics: AIAnalytics;
}

export interface AIFeature {
  type: 'content_generation' | 'design_assistance' | 'code_completion' | 'translation' | 'summarization';
  enabled: boolean;
  model: string;
  config: { [key: string]: any };
}

export interface AISuggestion {
  id: string;
  type: 'content' | 'design' | 'layout' | 'color' | 'typography';
  suggestion: string;
  confidence: number;
  context: string;
  accepted: boolean;
  createdAt: Date;
}

export interface AIAutomation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
}

export interface AIAnalytics {
  usageStats: AIUsageStats;
  performance: AIPerformance;
  feedback: AIFeedback[];
}

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  topFeatures: { feature: string; usage: number }[];
}

export interface AIPerformance {
  accuracy: number;
  relevance: number;
  speed: number;
  satisfaction: number;
}

export interface AIFeedback {
  suggestionId: string;
  rating: number;
  comment?: string;
  userId: string;
  timestamp: Date;
}

export interface WorkspaceAnalytics {
  usage: WorkspaceUsage;
  collaboration: CollaborationMetrics;
  productivity: ProductivityMetrics;
  engagement: EngagementMetrics;
}

export interface WorkspaceUsage {
  totalSessions: number;
  totalTime: number;
  averageSessionLength: number;
  activeUsers: number;
  peakConcurrentUsers: number;
  deviceBreakdown: { [device: string]: number };
}

export interface CollaborationMetrics {
  simultaneousEditors: number;
  conflictRate: number;
  commentActivity: number;
  shareFrequency: number;
  collaborationScore: number;
}

export interface ProductivityMetrics {
  elementsCreated: number;
  elementsModified: number;
  elementsDeleted: number;
  averageEditTime: number;
  completionRate: number;
  iterationCount: number;
}

export interface BCIInterface {
  id: string;
  type: 'eeg' | 'ecog' | 'fmri' | 'fnirs' | 'hybrid';
  device: BCIDevice;
  signals: BCISignal[];
  processing: SignalProcessing;
  classification: SignalClassification;
  feedback: BCIFeedback;
  calibration: BCICalibration;
  applications: BCIApplication[];
  safety: SafetyProtocol;
  isActive: boolean;
}

export interface BCIDevice {
  manufacturer: string;
  model: string;
  channels: number;
  samplingRate: number;
  resolution: number;
  bandwidth: { low: number; high: number };
  impedance: number;
  wireless: boolean;
  batteryLife?: number;
}

export interface BCISignal {
  id: string;
  type: 'motor_imagery' | 'p300' | 'ssvep' | 'erp' | 'alpha' | 'beta' | 'gamma';
  channels: number[];
  frequency: { min: number; max: number };
  amplitude: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  artifacts: SignalArtifact[];
  timestamp: Date;
}

export interface SignalArtifact {
  type: 'eye_blink' | 'muscle' | 'movement' | 'electrical' | 'cardiac';
  severity: 'low' | 'medium' | 'high';
  channels: number[];
  duration: number;
}

export interface SignalProcessing {
  filtering: FilterSettings;
  amplification: AmplificationSettings;
  digitization: DigitizationSettings;
  preprocessing: PreprocessingStep[];
}

export interface FilterSettings {
  highpass: { frequency: number; order: number };
  lowpass: { frequency: number; order: number };
  notch: { frequency: number; bandwidth: number };
  bandpass: { low: number; high: number; order: number };
}

export interface AmplificationSettings {
  gain: number;
  commonModeRejection: number;
  inputImpedance: number;
  noiseLevel: number;
}

export interface DigitizationSettings {
  samplingRate: number;
  resolution: number;
  quantizationNoise: number;
  dynamicRange: number;
}

export interface PreprocessingStep {
  type: 'artifact_removal' | 'baseline_correction' | 'normalization' | 'feature_extraction';
  algorithm: string;
  parameters: { [key: string]: any };
  order: number;
}

export interface SignalClassification {
  algorithm: 'svm' | 'lda' | 'neural_network' | 'random_forest' | 'deep_learning';
  features: FeatureSet[];
  model: ClassificationModel;
  performance: ClassificationPerformance;
  realtime: boolean;
}

export interface FeatureSet {
  type: 'time_domain' | 'frequency_domain' | 'time_frequency' | 'spatial';
  features: Feature[];
  dimensionality: number;
  selectionMethod: string;
}

export interface Feature {
  name: string;
  type: 'statistical' | 'spectral' | 'wavelet' | 'connectivity';
  value: number;
  importance: number;
}

export interface ClassificationModel {
  type: string;
  parameters: { [key: string]: any };
  trainingData: TrainingDataset;
  validation: ValidationResults;
  deployment: ModelDeployment;
}

export interface TrainingDataset {
  samples: number;
  classes: string[];
  sessions: number;
  duration: number;
  quality: 'low' | 'medium' | 'high';
}

export interface ValidationResults {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  crossValidation: CrossValidationResults;
}

export interface CrossValidationResults {
  folds: number;
  meanAccuracy: number;
  standardDeviation: number;
  confidence: number;
}

export interface ModelDeployment {
  version: string;
  deployedAt: Date;
  latency: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ClassificationPerformance {
  accuracy: number;
  latency: number;
  throughput: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  stability: number;
}

export interface BCIFeedback {
  type: 'visual' | 'auditory' | 'haptic' | 'multimodal';
  modality: FeedbackModality[];
  timing: FeedbackTiming;
  adaptation: FeedbackAdaptation;
}

export interface FeedbackModality {
  type: string;
  parameters: { [key: string]: any };
  intensity: number;
  duration: number;
  delay: number;
}

export interface FeedbackTiming {
  mode: 'synchronous' | 'asynchronous' | 'continuous';
  delay: number;
  updateRate: number;
  bufferSize: number;
}

export interface FeedbackAdaptation {
  enabled: boolean;
  algorithm: 'reinforcement_learning' | 'adaptive_filtering' | 'bayesian';
  parameters: { [key: string]: any };
  learningRate: number;
}

export interface BCICalibration {
  type: 'supervised' | 'unsupervised' | 'semi_supervised';
  sessions: CalibrationSession[];
  adaptation: CalibrationAdaptation;
  validation: CalibrationValidation;
}

export interface CalibrationSession {
  id: string;
  type: 'initial' | 'recalibration' | 'adaptation';
  duration: number;
  trials: number;
  accuracy: number;
  completedAt: Date;
}

export interface CalibrationAdaptation {
  enabled: boolean;
  frequency: 'continuous' | 'periodic' | 'on_demand';
  triggers: AdaptationTrigger[];
  algorithm: string;
}

export interface AdaptationTrigger {
  type: 'performance_drop' | 'time_elapsed' | 'user_request' | 'signal_drift';
  threshold: number;
  action: 'recalibrate' | 'adapt_model' | 'notify_user';
}

export interface CalibrationValidation {
  method: 'cross_validation' | 'holdout' | 'bootstrap';
  metrics: ValidationMetric[];
  threshold: number;
  passed: boolean;
}

export interface ValidationMetric {
  name: string;
  value: number;
  threshold: number;
  passed: boolean;
}

export interface BCIApplication {
  id: string;
  name: string;
  type: 'communication' | 'control' | 'navigation' | 'gaming' | 'rehabilitation' | 'monitoring';
  interface: ApplicationInterface;
  commands: BCICommand[];
  settings: ApplicationSettings;
  performance: ApplicationPerformance;
}

export interface ApplicationInterface {
  type: 'gui' | 'api' | 'direct' | 'hybrid';
  protocol: 'tcp' | 'udp' | 'websocket' | 'serial' | 'bluetooth';
  format: 'json' | 'xml' | 'binary' | 'custom';
  encryption: boolean;
}

export interface BCICommand {
  id: string;
  name: string;
  type: 'discrete' | 'continuous' | 'hybrid';
  signal: string;
  threshold: number;
  action: CommandAction;
  feedback: CommandFeedback;
}

export interface CommandAction {
  type: 'ui_interaction' | 'device_control' | 'communication' | 'navigation';
  parameters: { [key: string]: any };
  confirmation: boolean;
  timeout: number;
}

export interface CommandFeedback {
  visual: boolean;
  auditory: boolean;
  haptic: boolean;
  duration: number;
  intensity: number;
}

export interface ApplicationSettings {
  sensitivity: number;
  timeout: number;
  confirmationRequired: boolean;
  adaptiveThreshold: boolean;
  errorCorrection: boolean;
  logging: boolean;
}

export interface ApplicationPerformance {
  accuracy: number;
  speed: number;
  reliability: number;
  usability: number;
  satisfaction: number;
  errorRate: number;
}

export interface SafetyProtocol {
  guidelines: SafetyGuideline[];
  monitoring: SafetyMonitoring;
  alerts: SafetyAlert[];
  emergencyProcedures: EmergencyProcedure[];
  compliance: ComplianceRequirement[];
}

export interface SafetyGuideline {
  id: string;
  category: 'electrical' | 'biological' | 'psychological' | 'data' | 'operational';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mandatory: boolean;
}

export interface SafetyMonitoring {
  parameters: MonitoringParameter[];
  frequency: number;
  alerts: boolean;
  logging: boolean;
  realtime: boolean;
}

export interface MonitoringParameter {
  name: string;
  type: 'physiological' | 'technical' | 'behavioral';
  unit: string;
  range: { min: number; max: number };
  threshold: { warning: number; critical: number };
}

export interface SafetyAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  parameter: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EmergencyProcedure {
  id: string;
  trigger: string;
  steps: ProcedureStep[];
  contacts: EmergencyContact[];
  automated: boolean;
}

export interface ProcedureStep {
  order: number;
  action: string;
  description: string;
  timeout: number;
  critical: boolean;
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  email: string;
  priority: number;
}

export interface ComplianceRequirement {
  standard: string;
  version: string;
  requirements: string[];
  status: 'compliant' | 'non_compliant' | 'pending';
  lastAudit: Date;
  nextAudit: Date;
}