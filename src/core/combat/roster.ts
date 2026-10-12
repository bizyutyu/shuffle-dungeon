import { STAT_LABELS, type CombatantDef, type StatOrigin } from '@/core/types';
import { PLAYER_ACTION_IDS } from '@/core/combat/actions';

export const TOTAL_PHASES = 5;

export const PLAYER_DEF: CombatantDef = {
  id: 'player',
  name: 'ゆうしゃ',
  spriteKey: 'player',
  tint: null,
  isBoss: false,
  points: { hp: 12, mp: 8, str: 9, def: 7, int: 8, spd: 9 },
  actions: PLAYER_ACTION_IDS.map((id) => ({ id, weight: 1 })),
};

/** フェーズ順。どの敵も、手詰まりにならないよう、かくとうを最低1つ持たせる。 */
export const ENEMY_DEFS: readonly CombatantDef[] = [
  {
    id: 'enemy1',
    name: 'さまようゾンビ',
    spriteKey: 'enemy-zombie',
    tint: null,
    isBoss: false,
    points: { hp: 8, mp: 2, str: 7, def: 4, int: 2, spd: 3 },
    actions: [
      { id: 'attack', weight: 3 },
      { id: 'focus', weight: 1 },
    ],
  },
  {
    id: 'enemy2',
    name: 'ガイコツけんし',
    spriteKey: 'enemy-skeleton',
    tint: null,
    isBoss: false,
    points: { hp: 9, mp: 3, str: 9, def: 7, int: 3, spd: 8 },
    actions: [
      { id: 'attack', weight: 4 },
      { id: 'focus', weight: 1 },
    ],
  },
  {
    id: 'enemy3',
    name: 'どくキノコ',
    spriteKey: 'enemy-mushroom',
    tint: null,
    isBoss: false,
    points: { hp: 10, mp: 10, str: 4, def: 6, int: 10, spd: 5 },
    actions: [
      { id: 'attack', weight: 1 },
      { id: 'fire', weight: 3 },
      { id: 'heal', weight: 1 },
    ],
  },
  {
    id: 'enemy4',
    name: 'くさったゾンビ',
    spriteKey: 'enemy-zombie',
    tint: 0x9acd32,
    isBoss: false,
    points: { hp: 13, mp: 4, str: 11, def: 8, int: 4, spd: 6 },
    actions: [
      { id: 'attack', weight: 3 },
      { id: 'focus', weight: 1 },
    ],
  },
  {
    id: 'enemy5',
    name: 'オーガキング',
    spriteKey: 'boss-ogre',
    tint: null,
    isBoss: true,
    points: { hp: 18, mp: 8, str: 13, def: 10, int: 8, spd: 7 },
    actions: [
      { id: 'attack', weight: 3 },
      { id: 'fire', weight: 1 },
      { id: 'focus', weight: 1 },
    ],
  },
];

/** 「ガイコツけんしのみのまもり」のような、素点の出どころの表示名。 */
export function originLabel(origin: StatOrigin): string {
  const owner = [PLAYER_DEF, ...ENEMY_DEFS].find((d) => d.id === origin.ownerId);
  if (!owner) throw new Error(`originLabel: unknown owner ${origin.ownerId}`);
  return `${owner.name}の${STAT_LABELS[origin.stat]}`;
}
