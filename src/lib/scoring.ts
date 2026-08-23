import { SNIPPET_STAGES } from '@/types/game';

export function getStreakMultiplier(streak: number): number {
  if (streak <= 1) return 1.0;
  if (streak === 2) return 1.2;
  if (streak === 3) return 1.5;
  if (streak === 4) return 1.8;
  if (streak <= 7) return 2.2;
  return 2.5;
}

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
