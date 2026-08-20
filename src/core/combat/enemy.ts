import type { EnemyState } from '@/core/types';

export interface EnemyDef {
  hp: number;
  atk: number;
  /** Phaser側でロードした画像のアセットキー。core自体はPhaserに依存しない単なる文字列データ。 */
  spriteKey: string;
}

export const BASE_ENEMY: EnemyDef = { hp: 30, atk: 6, spriteKey: 'enemy-zombie' };

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
    spriteKey: def.spriteKey,
    x,
    y,
    alive: true,
    lastAttackAtSec: 0,
    taps: 0,
  };
}
