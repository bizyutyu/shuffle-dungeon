import {
  STAT_KEYS,
  type CombatProfile,
  type Combatant,
  type CombatantDef,
  type CombatantId,
  type RawStatPoints,
  type StatPoints,
  type Stats,
} from '@/core/types';
import { HP_PER_POINT, MP_PER_POINT } from '@/core/balance';
import { ACTIONS } from '@/core/combat/actions';

/** 初期の素点に、出どころ（自分のその項目）を付ける。 */
export function toStatPoints(ownerId: CombatantId, raw: RawStatPoints): StatPoints {
  const entries = STAT_KEYS.map((stat) => [stat, { value: raw[stat], origin: { ownerId, stat } }]);
  return Object.fromEntries(entries) as StatPoints;
}

export function deriveStats(points: StatPoints): Stats {
  return {
    maxHp: points.hp.value * HP_PER_POINT,
    maxMp: points.mp.value * MP_PER_POINT,
    str: points.str.value,
    def: points.def.value,
    int: points.int.value,
    spd: points.spd.value,
  };
}

/** 補正なしの能力。敵はこれをそのまま使い、プレイヤーはここにレリックを重ねる。 */
export function baseProfile(points: StatPoints): CombatProfile {
  return {
    stats: deriveStats(points),
    powerMul: { kakutou: 1, mahou: 1 },
    mpCostDelta: 0,
  };
}

export function createCombatant(def: CombatantDef): Combatant {
  const points = toStatPoints(def.id, def.points);
  const stats = deriveStats(points);
  return {
    id: def.id,
    name: def.name,
    spriteKey: def.spriteKey,
    tint: def.tint,
    isBoss: def.isBoss,
    points,
    actions: def.actions.map(({ id, weight }) => ({
      id,
      target: ACTIONS[id].baseTarget,
      weight,
    })),
    hp: stats.maxHp,
    mp: stats.maxMp,
  };
}

/** フェーズ開始時の全回復。 */
export function restoreFully(c: Combatant, profile: CombatProfile): void {
  c.hp = profile.stats.maxHp;
  c.mp = profile.stats.maxMp;
}
