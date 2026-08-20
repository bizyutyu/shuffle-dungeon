export interface Modifiers {
  atkMul: number;
  atkSpeedMul: number;
  moveSpeedMul: number;
  damageTakenMul: number;
  critChance: number;
  misfireChance: number;
  hpRegenPerSec: number;
  dropRateMul: number;
  enemySpeedMul: number;
  enemySpawnRateMul: number;
}

export interface EnemyState {
  id: string;
  hp: number;
  maxHp: number;
  atk: number;
  x: number;
  y: number;
  alive: boolean;
  lastAttackAtSec: number;
  taps: number;
}

export type RunStatus = 'running' | 'won' | 'lost';
export type FloorPhase = 'combat' | 'cleared';

export interface RunState {
  seed: number;
  floor: number;
  floorPhase: FloorPhase;
  isBossFloor: boolean;
  status: RunStatus;
  playerHp: number;
  playerMaxHp: number;
  enemies: EnemyState[];
  relicIds: string[];
  score: number;
  elapsedSec: number;
}
