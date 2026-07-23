import type { CreateHuntRequest, Coordinates } from '../types';
import { MAX_CLUES_PER_HUNT, MIN_CLUES_PER_HUNT, MAX_TREASURE_RADIUS_METERS, MIN_TREASURE_RADIUS_METERS, MAX_HUNT_EXPIRATION_HOURS, MIN_HUNT_EXPIRATION_HOURS } from '../constants';

export function validateCreateHuntRequest(req: CreateHuntRequest): string[] {
  const errors: string[] = [];

  if (!req.title || req.title.length < 3 || req.title.length > 100) {
    errors.push('Title must be between 3 and 100 characters');
  }
  if (!req.description || req.description.length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  if (!req.reward || isNaN(Number(req.reward)) || Number(req.reward) <= 0) {
    errors.push('Reward must be a positive number');
  }
  if (!req.treasureLocation || !isValidCoordinates(req.treasureLocation)) {
    errors.push('Invalid treasure location coordinates');
  }
  if (
    req.treasureRadius < MIN_TREASURE_RADIUS_METERS ||
    req.treasureRadius > MAX_TREASURE_RADIUS_METERS
  ) {
    errors.push(`Treasure radius must be between ${MIN_TREASURE_RADIUS_METERS}m and ${MAX_TREASURE_RADIUS_METERS}m`);
  }
  if (
    !req.clues ||
    req.clues.length < MIN_CLUES_PER_HUNT ||
    req.clues.length > MAX_CLUES_PER_HUNT
  ) {
    errors.push(`Clue count must be between ${MIN_CLUES_PER_HUNT} and ${MAX_CLUES_PER_HUNT}`);
  }
  if (
    req.expirationHours < MIN_HUNT_EXPIRATION_HOURS ||
    req.expirationHours > MAX_HUNT_EXPIRATION_HOURS
  ) {
    errors.push(`Expiration must be between ${MIN_HUNT_EXPIRATION_HOURS}h and ${MAX_HUNT_EXPIRATION_HOURS}h`);
  }

  req.clues?.forEach((clue, i) => {
    if (!isValidCoordinates(clue.location)) {
      errors.push(`Clue ${i + 1}: Invalid coordinates`);
    }
    if (!clue.hintText || clue.hintText.length < 1) {
      errors.push(`Clue ${i + 1}: Hint text is required`);
    }
    if (clue.sequence !== i + 1) {
      errors.push(`Clue ${i + 1}: Sequence must be ${i + 1}`);
    }
  });

  return errors;
}

function isValidCoordinates(c: Coordinates): boolean {
  return (
    typeof c.latitude === 'number' &&
    typeof c.longitude === 'number' &&
    c.latitude >= -90 &&
    c.latitude <= 90 &&
    c.longitude >= -180 &&
    c.longitude <= 180
  );
}
