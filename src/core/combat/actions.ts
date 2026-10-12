import type { ActionDef, ActionId } from '@/core/types';

export const ACTIONS: Record<ActionId, ActionDef> = {
  attack: {
    id: 'attack',
    name: 'こうげき',
    kind: 'kakutou',
    effect: 'damage',
    baseTarget: 'opponent',
    power: 2.0,
    mpCost: 0,
  },
  focus: {
    id: 'focus',
    name: 'きあい',
    kind: 'kakutou',
    effect: 'heal',
    baseTarget: 'self',
    power: 1.2,
    mpCost: 0,
  },
  fire: {
    id: 'fire',
    name: 'ファイア',
    kind: 'mahou',
    effect: 'damage',
    baseTarget: 'opponent',
    power: 2.5,
    mpCost: 4,
  },
  heal: {
    id: 'heal',
    name: 'ヒール',
    kind: 'mahou',
    effect: 'heal',
    baseTarget: 'self',
    power: 2.0,
    mpCost: 5,
  },
};

export const PLAYER_ACTION_IDS: readonly ActionId[] = ['attack', 'focus', 'fire', 'heal'];
