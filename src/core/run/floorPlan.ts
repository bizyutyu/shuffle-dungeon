import type { EnemyDef } from '@/core/combat/enemy';

export interface FloorPlan {
  floor: number;
  isBoss: boolean;
  enemyDefs: EnemyDef[];
  positions: readonly [number, number][];
}

const BASE_ENEMY: EnemyDef = { hp: 30, atk: 6 };
const BOSS_ENEMY: EnemyDef = { hp: 220, atk: 9 };

const NORMAL_POSITIONS: readonly [number, number][] = [
  [240, 500],
  [480, 500],
  [360, 700],
];
const BOSS_POSITIONS: readonly [number, number][] = [[360, 560]];

export const TOTAL_FLOORS = 5;

export function planFloor(floor: number): FloorPlan {
  const isBoss = floor >= TOTAL_FLOORS;
  if (isBoss) {
    return { floor, isBoss, enemyDefs: [BOSS_ENEMY], positions: BOSS_POSITIONS };
  }
  // 深いフロアほど敵が少し硬くなる
  const scaledHp = BASE_ENEMY.hp + (floor - 1) * 4;
  const enemyDefs = NORMAL_POSITIONS.map(() => ({ ...BASE_ENEMY, hp: scaledHp }));
  return { floor, isBoss, enemyDefs, positions: NORMAL_POSITIONS };
}
