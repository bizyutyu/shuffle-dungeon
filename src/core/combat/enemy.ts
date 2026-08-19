import type { EnemyState } from '@/core/types';

export interface EnemyDef {
  hp: number;
  atk: number;
}

export const BASE_ENEMY: EnemyDef = { hp: 30, atk: 6 };

export function createEnemy(
  id: string,
  x: number,
  y: number,
  def: EnemyDef = BASE_ENEMY,
): EnemyState {
  return {
    id,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    x,
    y,
    alive: true,
    lastAttackAtSec: 0,
    taps: 0,
  };
}
