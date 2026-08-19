import type { Modifiers } from '@/core/types';

export type ZoneId = 'aggressive' | 'normal' | 'chaos';

export interface ZoneDef {
  id: ZoneId;
  label: string;
  anchor: number; // この値で mods が純度100%
  bounds: readonly [number, number]; // UI表示・スコア判定用
  colorHex: number;
  mods: Modifiers;
}

export const ZONES: readonly ZoneDef[] = [
  {
    id: 'aggressive',
    label: 'AGGRESSIVE',
    anchor: 15,
    bounds: [0, 35],
    colorHex: 0xff3b30,
    mods: {
      atkMul: 2.4,
      atkSpeedMul: 1.6,
      moveSpeedMul: 1.4,
      damageTakenMul: 2.0,
      critChance: 0.35,
      misfireChance: 0.18,
      hpRegenPerSec: 0,
      dropRateMul: 1.0,
      enemySpeedMul: 1.0,
      enemySpawnRateMul: 1.0,
    },
  },
  {
    id: 'normal',
    label: 'NORMAL',
    anchor: 50,
    bounds: [35, 65],
    colorHex: 0x8e8e93,
    mods: {
      atkMul: 1.0,
      atkSpeedMul: 1.0,
      moveSpeedMul: 1.0,
      damageTakenMul: 1.0,
      critChance: 0.05,
      misfireChance: 0.0,
      hpRegenPerSec: 0,
      dropRateMul: 1.0,
      enemySpeedMul: 1.0,
      enemySpawnRateMul: 1.0,
    },
  },
  {
    id: 'chaos',
    label: 'CHAOS',
    anchor: 85,
    bounds: [65, 100],
    colorHex: 0x30d158,
    mods: {
      atkMul: 0.45,
      atkSpeedMul: 0.35,
      moveSpeedMul: 0.8,
      damageTakenMul: 0.7,
      critChance: 0.0,
      misfireChance: 0.0,
      hpRegenPerSec: 3.5,
      dropRateMul: 2.2,
      enemySpeedMul: 0.45,
      enemySpawnRateMul: 2.5,
    },
  },
] as const;

export function zoneAt(value: number): ZoneId {
  for (let i = 0; i < ZONES.length; i++) {
    const z = ZONES[i];
    if (!z) continue;
    const isLast = i === ZONES.length - 1;
    // 境界の重複を避けるため、最後のゾーン以外は上端を排他にする
    const inUpper = isLast ? value <= z.bounds[1] : value < z.bounds[1];
    if (value >= z.bounds[0] && inUpper) return z.id;
  }
  const last = ZONES[ZONES.length - 1];
  if (!last) throw new Error('ZONES is empty');
  return last.id;
}
