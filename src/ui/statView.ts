import {
  STAT_KEYS,
  STAT_LABELS,
  type CombatantId,
  type StatKey,
  type StatPoints,
  type Stats,
} from '@/core/types';
import { originLabel } from '@/core/combat/roster';

const VALUE_OF: Record<StatKey, (s: Stats) => number> = {
  hp: (s) => s.maxHp,
  mp: (s) => s.maxMp,
  str: (s) => s.str,
  def: (s) => s.def,
  int: (s) => s.int,
  spd: (s) => s.spd,
};

export interface StatEntry {
  key: StatKey;
  label: string;
  /** 換算・レリック補正込みの値 */
  value: number;
  /** 「ガイコツけんしのみのまもり」のような、シャッフル前の出どころ */
  origin: string;
  /** シャッフル前と同じ（自分のその項目のまま）か */
  isOriginal: boolean;
}

/** 画面に並べるための、項目ごとの値と出どころ。 */
export function statEntries(ownerId: CombatantId, stats: Stats, points: StatPoints): StatEntry[] {
  return STAT_KEYS.map((key) => {
    const { origin } = points[key];
    return {
      key,
      label: STAT_LABELS[key],
      value: VALUE_OF[key](stats),
      origin: originLabel(origin),
      isOriginal: origin.ownerId === ownerId && origin.stat === key,
    };
  });
}
