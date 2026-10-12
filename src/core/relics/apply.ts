import type { CombatProfile, StatPoints } from '@/core/types';
import { baseProfile } from '@/core/combat/combatant';
import { getRelic } from '@/core/relics/registry';

/** 素点から求めた能力に、所持レリックの効果を重ねる。 */
export function profileWithRelics(points: StatPoints, relicIds: readonly string[]): CombatProfile {
  const profile = baseProfile(points);
  for (const id of relicIds) {
    const { hooks } = getRelic(id);
    hooks.modifyStats?.(profile.stats);
    if (hooks.powerMultiplier) {
      profile.powerMul.kakutou *= hooks.powerMultiplier('kakutou');
      profile.powerMul.mahou *= hooks.powerMultiplier('mahou');
    }
    profile.mpCostDelta += hooks.mpCostDelta?.() ?? 0;
  }
  return profile;
}
