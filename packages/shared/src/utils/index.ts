export function calculateLevel(xp: number): number {
  // Simple XP-to-level using thresholds array
  const thresholds = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
    10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
  ];

  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) return i + 1;
  }
  return 1;
}

export function xpForNextLevel(currentLevel: number): number {
  const thresholds = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500,
    10000, 13000, 16500, 20500, 25000, 30000, 36000, 43000, 51000, 60000,
  ];
  if (currentLevel >= thresholds.length) return 0;
  return thresholds[currentLevel];
}

export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
