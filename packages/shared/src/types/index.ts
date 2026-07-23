// ─── User & Wallet ───────────────────────────────────────────
export enum UserRole {
  GAME_MASTER = 'GAME_MASTER',
  PLAYER = 'PLAYER',
}

export interface Wallet {
  id: string;
  address: string;
  userId: string;
  roles: UserRole[];
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  wallets: Wallet[];
  createdAt: string;
  updatedAt: string;
}

// ─── Treasure Hunt ───────────────────────────────────────────
export enum HuntStatus {
  DRAFT = 'DRAFT',
  FUNDED = 'FUNDED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum HuntDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  LEGENDARY = 'LEGENDARY',
}

export enum HuntVisibility {
  PUBLIC = 'PUBLIC',
  UNLISTED = 'UNLISTED',
  INVITE_ONLY = 'INVITE_ONLY',
}

export enum RewardToken {
  XLM = 'XLM',
  USDC = 'USDC',
  CUSTOM = 'CUSTOM',
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TreasureHunt {
  id: string;
  ownerWalletId: string;
  escrowContractId: string;
  title: string;
  description: string;
  reward: string;
  rewardToken: RewardToken;
  customTokenAddress?: string;
  status: HuntStatus;
  difficulty: HuntDifficulty;
  visibility: HuntVisibility;
  treasureLocation: Coordinates;
  treasureRadius: number;
  clueCount: number;
  expirationHours: number;
  maxPlayers?: number;
  imageUrls: string[];
  tags: string[];
  createdAt: string;
  activatedAt?: string;
  claimedAt?: string;
  expiresAt?: string;
  winnerWalletId?: string;
}

// ─── Clues ───────────────────────────────────────────────────
export enum ClueType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  QR = 'QR',
  NFC = 'NFC',
  PUZZLE = 'PUZZLE',
  AR = 'AR',
}

export enum UnlockType {
  GEO_FENCE = 'GEO_FENCE',
  TIME_LOCK = 'TIME_LOCK',
  SEQUENTIAL = 'SEQUENTIAL',
  RANDOM = 'RANDOM',
  PUZZLE = 'PUZZLE',
}

export interface Clue {
  id: string;
  huntId: string;
  sequence: number;
  location: Coordinates;
  unlockRadius: number;
  hintText: string;
  hintImageUrl?: string;
  hintAudioUrl?: string;
  qrCodeData?: string;
  nfcTagId?: string;
  puzzleData?: Record<string, unknown>;
  clueType: ClueType;
  unlockType: UnlockType;
  unlockTime?: string;
  isFinal: boolean;
  createdAt: string;
}

// ─── Player Progression ──────────────────────────────────────
export enum Badge {
  EXPLORER = 'EXPLORER',
  FIRST_BLOOD = 'FIRST_BLOOD',
  WALKER_100KM = 'WALKER_100KM',
  TREASURE_HUNTER = 'TREASURE_HUNTER',
  PUZZLE_MASTER = 'PUZZLE_MASTER',
  SPEED_RUNNER = 'SPEED_RUNNER',
  LEGEND = 'LEGEND',
  BLOCKCHAIN_PIONEER = 'BLOCKCHAIN_PIONEER',
}

export interface PlayerProgress {
  id: string;
  walletId: string;
  xp: number;
  level: number;
  completedHunts: number;
  winCount: number;
  lossCount: number;
  distanceWalked: number;
  totalRewardsEarned: string;
  badges: Badge[];
  leaderboardScore: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Hunt Attempt ────────────────────────────────────────────
export enum AttemptStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface HuntAttempt {
  id: string;
  huntId: string;
  playerWalletId: string;
  status: AttemptStatus;
  cluesUnlocked: number;
  startedAt: string;
  completedAt?: string;
  distanceTraveled: number;
}

// ─── Escrow ──────────────────────────────────────────────────
export enum EscrowStatus {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  ACTIVE = 'ACTIVE',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
}

export interface EscrowContract {
  id: string;
  contractAddress: string;
  huntId: string;
  status: EscrowStatus;
  reward: string;
  rewardToken: RewardToken;
  createdAt: string;
  fundedAt?: string;
  claimedAt?: string;
  refundedAt?: string;
}

// ─── Events ──────────────────────────────────────────────────
export enum GameEventType {
  HUNT_CREATED = 'HUNT_CREATED',
  HUNT_FUNDED = 'HUNT_FUNDED',
  HUNT_ACTIVATED = 'HUNT_ACTIVATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  CLUE_UNLOCKED = 'CLUE_UNLOCKED',
  TREASURE_CLAIMED = 'TREASURE_CLAIMED',
  HUNT_EXPIRED = 'HUNT_EXPIRED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  LEADERBOARD_UPDATED = 'LEADERBOARD_UPDATED',
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  huntId?: string;
  walletId?: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ─── API Types ───────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface NearbyHuntRequest {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  difficulty?: HuntDifficulty;
  status?: HuntStatus;
}

export interface CreateHuntRequest {
  title: string;
  description: string;
  reward: string;
  rewardToken: RewardToken;
  customTokenAddress?: string;
  difficulty: HuntDifficulty;
  visibility: HuntVisibility;
  treasureLocation: Coordinates;
  treasureRadius: number;
  clues: CreateClueRequest[];
  expirationHours: number;
  maxPlayers?: number;
  imageUrls?: string[];
  tags?: string[];
}

export interface CreateClueRequest {
  sequence: number;
  location: Coordinates;
  unlockRadius: number;
  hintText: string;
  hintImageUrl?: string;
  hintAudioUrl?: string;
  clueType: ClueType;
  unlockType: UnlockType;
  isFinal: boolean;
  puzzleData?: Record<string, unknown>;
}

export interface UnlockClueRequest {
  huntId: string;
  clueId: string;
  latitude: number;
  longitude: number;
  locationProof?: LocationProof;
}

export interface ClaimTreasureRequest {
  huntId: string;
  latitude: number;
  longitude: number;
  locationProof?: LocationProof;
}

export interface LocationProof {
  signature: string;
  timestamp: number;
  nonce: string;
  deviceIntegrityToken?: string;
}
