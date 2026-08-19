import type { Modifiers } from '@/core/types';
import type { Rng } from '@/core/rng';

const BASE_PLAYER_ATK = 10;

export interface AttackResult {
  damage: number;
  isCrit: boolean;
  isMisfire: boolean;
}

/** プレイヤーの攻撃1回分を解決する。暴発時はダメージ0。 */
export function resolvePlayerAttack(mods: Modifiers, rng: Rng): AttackResult {
  if (rng.next() < mods.misfireChance) {
    return { damage: 0, isCrit: false, isMisfire: true };
  }
  const isCrit = rng.next() < mods.critChance;
  const base = BASE_PLAYER_ATK * mods.atkMul;
  return { damage: isCrit ? base * 2 : base, isCrit, isMisfire: false };
}

export function resolveEnemyDamageToPlayer(enemyAtk: number, mods: Modifiers): number {
  return enemyAtk * mods.damageTakenMul;
}
