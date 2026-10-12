import type { ActionId, ActionTarget, Combatant, CombatantId, RawStatPoints } from '@/core/types';
import { baseProfile, toStatPoints } from '@/core/combat/combatant';
import type { BattleSide } from '@/core/combat/turn';

export const FLAT: RawStatPoints = { hp: 10, mp: 10, str: 10, def: 10, int: 10, spd: 10 };

export function side(
  id: CombatantId,
  points: Partial<RawStatPoints> = {},
  actions: { id: ActionId; target?: ActionTarget; weight?: number }[] = [{ id: 'attack' }],
): BattleSide {
  const full = toStatPoints(id, { ...FLAT, ...points });
  const profile = baseProfile(full);
  const combatant: Combatant = {
    id,
    name: id,
    spriteKey: '',
    tint: null,
    isBoss: false,
    points: full,
    actions: actions.map((a) => ({
      id: a.id,
      target: a.target ?? (a.id === 'attack' || a.id === 'fire' ? 'opponent' : 'self'),
      weight: a.weight ?? 1,
    })),
    hp: profile.stats.maxHp,
    mp: profile.stats.maxMp,
  };
  return { combatant, profile };
}
