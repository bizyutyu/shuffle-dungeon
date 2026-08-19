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

export interface RunState {
  seed: number;
  floor: number;
  status: RunStatus;
  playerHp: number;
  playerMaxHp: number;
  enemies: EnemyState[];
  score: number;
  elapsedSec: number;
}
