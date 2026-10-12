import { TOTAL_PHASES } from '@/core/combat/roster';

const POINTS_PER_PHASE = 1000;
const VICTORY_BONUS = 5000;

/** 到達フェーズ × 1000 ＋ 勝利ボーナス。 */
export function computeScore(phaseReached: number, victory: boolean): number {
  const phase = Math.min(Math.max(phaseReached, 0), TOTAL_PHASES);
  return phase * POINTS_PER_PHASE + (victory ? VICTORY_BONUS : 0);
}
