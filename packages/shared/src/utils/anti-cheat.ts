import { MAX_SPEED_KMH, TELEPORT_THRESHOLD_KM } from '../constants';
import type { Coordinates } from '../types';
import { calculateSpeedKmh, haversineDistance } from './geo';

export interface AntiCheatCheck {
  passed: boolean;
  reason?: string;
}

export function checkSpeed(
  from: Coordinates,
  to: Coordinates,
  timeDeltaSeconds: number,
): AntiCheatCheck {
  if (timeDeltaSeconds <= 0) {
    return { passed: false, reason: 'Invalid time delta' };
  }
  const speed = calculateSpeedKmh(from, to, timeDeltaSeconds);
  if (speed > MAX_SPEED_KMH) {
    return {
      passed: false,
      reason: `Speed too high: ${speed.toFixed(1)} km/h (max ${MAX_SPEED_KMH})`,
    };
  }
  return { passed: true };
}

export function checkTeleport(
  from: Coordinates,
  to: Coordinates,
): AntiCheatCheck {
  const distanceKm = haversineDistance(from, to) / 1000;
  if (distanceKm > TELEPORT_THRESHOLD_KM) {
    return {
      passed: false,
      reason: `Impossible travel detected: ${distanceKm.toFixed(1)} km`,
    };
  }
  return { passed: true };
}

export function checkGPSAccuracy(accuracyMeters: number): AntiCheatCheck {
  if (accuracyMeters > 20) {
    return {
      passed: false,
      reason: `GPS accuracy too low: ${accuracyMeters}m`,
    };
  }
  return { passed: true };
}

export function validateLocationProof(
  timestamp: number,
  nonce: string,
): AntiCheatCheck {
  const now = Date.now();
  const age = (now - timestamp) / 1000;
  if (age > 300) {
    return {
      passed: false,
      reason: 'Location proof expired (>5 minutes old)',
    };
  }
  if (age < 0) {
    return {
      passed: false,
      reason: 'Location proof timestamp is in the future',
    };
  }
  if (!nonce || nonce.length < 16) {
    return {
      passed: false,
      reason: 'Invalid nonce',
    };
  }
  return { passed: true };
}
