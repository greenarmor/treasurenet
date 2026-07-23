// ─── Game Constants ──────────────────────────────────────────

export const XP_REWARDS = {
  WALKING_PER_KM: 10,
  FINDING_CLUE: 50,
  COMPLETING_CLUE: 100,
  SOLVING_PUZZLE: 200,
  WINNING_HUNT: 500,
  DAILY_LOGIN: 25,
  REFERRAL: 100,
} as const;

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
  10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
  70000, 82000, 96000, 112000, 130000, 150000, 175000, 205000, 240000, 280000,
  330000, 390000, 460000, 540000, 630000, 730000, 850000, 1000000, 1200000, 1500000,
];

export const MAX_CLUES_PER_HUNT = 20;
export const MIN_CLUES_PER_HUNT = 2;
export const MAX_TREASURE_RADIUS_METERS = 100;
export const MIN_TREASURE_RADIUS_METERS = 5;
export const MAX_HUNT_EXPIRATION_HOURS = 720; // 30 days
export const MIN_HUNT_EXPIRATION_HOURS = 1;
export const MAX_NEARBY_SEARCH_RADIUS_KM = 100;
export const DEFAULT_NEARBY_SEARCH_RADIUS_KM = 10;
export const GPS_MIN_ACCURACY_METERS = 20;
export const MAX_SPEED_KMH = 50; // Anti-cheat: max human speed
export const TELEPORT_THRESHOLD_KM = 10; // Anti-cheat: impossible travel

export const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as 'testnet' | 'public';
export const STELLAR_HORIZON_URL =
  STELLAR_NETWORK === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org';

export const SOROBAN_RPC_URL =
  STELLAR_NETWORK === 'public'
    ? 'https://soroban.stellar.org'
    : 'https://soroban-testnet.stellar.org';
