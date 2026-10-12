import type { ActionDef, CombatProfile } from '@/core/types';
import { RESIST_RATE } from '@/core/balance';

/** まほうはレリックで軽減できるが、0にはならない（下限1）。かくとうは常に0。 */
export function mpCostOf(action: ActionDef, profile: CombatProfile): number {
  if (action.kind === 'kakutou') return 0;
  return Math.max(1, action.mpCost + profile.mpCostDelta);
}

/**
 * 行動1回分のダメージ量・回復量。乱数によるゆらぎはなく、同じ入力なら必ず同じ値になる。
 * 対象がシャッフルで自分になっていても同じ式を使う（自分を殴れば自分の耐性で軽減される）。
 */
export function computeAmount(
  action: ActionDef,
  actor: CombatProfile,
  target: CombatProfile,
): number {
  const isKakutou = action.kind === 'kakutou';
  const offense = isKakutou ? actor.stats.str : actor.stats.int;
  const raw = offense * action.power * actor.powerMul[action.kind];
  if (action.effect === 'heal') return Math.max(1, Math.round(raw));

  const resist = isKakutou ? target.stats.def : target.stats.int;
  return Math.max(1, Math.round(raw - resist * RESIST_RATE));
}
