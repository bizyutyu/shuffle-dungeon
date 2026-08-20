import type { EnemyDef } from '@/core/combat/enemy';

export interface FloorPlan {
  floor: number;
  isBoss: boolean;
  enemyDefs: EnemyDef[];
  positions: readonly [number, number][];
}

const ENEMY_SPRITE_KEYS = ['enemy-zombie', 'enemy-skeleton', 'enemy-mushroom'] as const;
const BASE_ENEMY_HP = 30;
const BASE_ENEMY_ATK = 6;
const BOSS_ENEMY: EnemyDef = { hp: 220, atk: 9, spriteKey: 'boss-ogre' };

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
  const scaledHp = BASE_ENEMY_HP + (floor - 1) * 4;
  const enemyDefs = NORMAL_POSITIONS.map((_, i) => ({
    hp: scaledHp,
    atk: BASE_ENEMY_ATK,
    spriteKey: ENEMY_SPRITE_KEYS[i % ENEMY_SPRITE_KEYS.length] ?? ENEMY_SPRITE_KEYS[0],
  }));
  return { floor, isBoss, enemyDefs, positions: NORMAL_POSITIONS };
}
