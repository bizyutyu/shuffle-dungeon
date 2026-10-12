import { describe, expect, it } from 'vitest';
import { profileWithRelics } from '@/core/relics/apply';
import { allRelics } from '@/core/relics/registry';
import '@/core/relics/defs';
import { toStatPoints } from '@/core/combat/combatant';
import { FLAT } from './helpers';

const POINTS = toStatPoints('player', FLAT);

describe('profileWithRelics', () => {
  it('ステータス加算・倍率・消費MP軽減が重なる', () => {
    const p = profileWithRelics(POINTS, ['power_bracer', 'fighters_glove', 'thrift_ring']);
    expect(p.stats.str).toBe(FLAT.str + 3);
    expect(p.powerMul).toEqual({ kakutou: 1.3, mahou: 1 });
    expect(p.mpCostDelta).toBe(-2);
  });

  it('すばやさを上げるレリックは存在しない', () => {
    for (const r of allRelics()) {
      const p = profileWithRelics(POINTS, [r.id]);
      expect(p.stats.spd).toBe(FLAT.spd);
    }
  });
});
