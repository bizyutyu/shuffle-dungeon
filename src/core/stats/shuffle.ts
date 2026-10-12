import { STAT_KEYS, type ActionTarget, type Combatant } from '@/core/types';
import type { Rng } from '@/core/rng';
import { TARGET_FLIP_CHANCE } from '@/core/balance';
import { ACTIONS } from '@/core/combat/actions';

function flip(target: ActionTarget): ActionTarget {
  return target === 'self' ? 'opponent' : 'self';
}

/** 全員の素点（人数×6項目）をひとまとめにして、ランダムに配り直す。出どころも一緒に移動する。 */
export function redistributePoints(combatants: readonly Combatant[], rng: Rng): void {
  const pool = combatants.flatMap((c) => STAT_KEYS.map((key) => c.points[key]));
  const dealt = rng.shuffle(pool);
  let i = 0;
  for (const c of combatants) {
    for (const key of STAT_KEYS) {
      const point = dealt[i++];
      if (point === undefined) throw new Error('redistributePoints: pool exhausted');
      c.points[key] = point;
    }
  }
}

/**
 * 各行動の対象を、本来の対象から一定確率で反転させる。
 * 前回のシャッフル結果からではなく毎回本来の対象から抽選し直すので、反転は積み重ならない。
 */
export function rerollTargets(combatants: readonly Combatant[], rng: Rng): void {
  for (const c of combatants) {
    for (const slot of c.actions) {
      const base = ACTIONS[slot.id].baseTarget;
      slot.target = rng.next() < TARGET_FLIP_CHANCE ? flip(base) : base;
    }
  }
}

export function shuffleWorld(combatants: readonly Combatant[], rng: Rng): void {
  redistributePoints(combatants, rng);
  rerollTargets(combatants, rng);
}
