import { SNIPPET_STAGES } from '@/types/game';

/**
 * Consistent Streak Multiplier:
 * Streak 0-1: 1.0x (Standard)
 * Streak 2:   1.2x (+20% bonus)
 * Streak 3:   1.5x (+50% bonus)
 * Streak 4:   1.8x (+80% bonus)
 * Streak 5-7: 2.2x (+120% bonus)
 * Streak 8+:  2.5x (+150% mega bonus)
 */
export function getStreakMultiplier(streak: number): number {
  if (streak <= 1) return 1.0;
  if (streak === 2) return 1.2;
  if (streak === 3) return 1.5;
  if (streak === 4) return 1.8;
  if (streak <= 7) return 2.2;
  return 2.5;
}

export function getStreakMultiplierText(streak: number): string {
  const mult = getStreakMultiplier(streak);
  return `${mult.toFixed(1)}x`;
}

/**
 * Calculate round score based on unlocked snippet difficulty stage:
 * Impossible (0.2s) -> 1,000 pts (Highest)
 * Expert (0.8s)     -> 800 pts
 * Hard (2.5s)       -> 600 pts
 * Medium (5.0s)     -> 400 pts
 * Easy (10.0s)      -> 200 pts (Lowest)
 */
export function calculateStageScore(
  stageIndex: number, // 0 to 4
  streak: number
): { baseScore: number; multiplier: number; finalScore: number } {
  const stage = SNIPPET_STAGES[Math.min(4, Math.max(0, stageIndex))];
  const baseScore = stage.basePoints;
  const multiplier = getStreakMultiplier(streak);
  const finalScore = Math.round(baseScore * multiplier);

  return {
    baseScore,
    multiplier,
    finalScore,
  };
}
