import { describe, expect, it } from 'vitest';
import { STAT_KEYS, type Combatant } from '@/core/types';
import { Rng } from '@/core/rng';
import { TARGET_FLIP_CHANCE } from '@/core/balance';
import { ACTIONS } from '@/core/combat/actions';
import { createCombatant } from '@/core/combat/combatant';
import { ENEMY_DEFS, PLAYER_DEF, originLabel } from '@/core/combat/roster';
import { redistributePoints, rerollTargets, shuffleWorld } from '@/core/stats/shuffle';

function world(): Combatant[] {
  return [PLAYER_DEF, ...ENEMY_DEFS].map(createCombatant);
}

function allPoints(cs: Combatant[]): number[] {
  return cs.flatMap((c) => STAT_KEYS.map((k) => c.points[k].value));
}

describe('redistributePoints', () => {
  it('36個の素点の組み合わせ（多重集合）は変わらない', () => {
    const cs = world();
    const before = allPoints(cs).sort((a, b) => a - b);
    redistributePoints(cs, new Rng(1));
    expect(allPoints(cs).sort((a, b) => a - b)).toEqual(before);
  });

  it('項目をまたいで配り直される（同じ項目内の並べ替えにとどまらない）', () => {
    const cs = world();
    const hpBefore = cs.map((c) => c.points.hp.value).sort();
    let changed = false;
    for (let seed = 0; seed < 20 && !changed; seed++) {
      const w = world();
      redistributePoints(w, new Rng(seed));
      changed =
        w
          .map((c) => c.points.hp.value)
          .sort()
          .join() !== hpBefore.join();
    }
    expect(changed).toBe(true);
  });

  it('値と出どころは組のまま移動し、36個の出どころはすべて残る', () => {
    const cs = world();
    const pairs = (w: Combatant[]): string[] =>
      w
        .flatMap((c) =>
          STAT_KEYS.map((k) => {
            const p = c.points[k];
            return `${p.origin.ownerId}.${p.origin.stat}=${p.value}`;
          }),
        )
        .sort();
    const before = pairs(cs);
    redistributePoints(cs, new Rng(5));
    expect(pairs(cs)).toEqual(before);
    expect(new Set(before).size).toBe(36);
  });

  it('同じシードなら同じ結果になる', () => {
    const a = world();
    const b = world();
    shuffleWorld(a, new Rng(42));
    shuffleWorld(b, new Rng(42));
    expect(a).toEqual(b);
  });
});

describe('rerollTargets', () => {
  it('反転は本来の対象から抽選し直すため、積み重ならない', () => {
    const cs = world();
    const rng = new Rng(7);
    let flipped = 0;
    let total = 0;
    for (let i = 0; i < 500; i++) {
      rerollTargets(cs, rng);
      for (const c of cs) {
        for (const s of c.actions) {
          total++;
          if (s.target !== ACTIONS[s.id].baseTarget) flipped++;
        }
      }
    }
    expect(flipped / total).toBeCloseTo(TARGET_FLIP_CHANCE, 1);
  });
});

describe('originLabel', () => {
  it('出どころを「名前の項目」で表す', () => {
    expect(originLabel({ ownerId: 'enemy2', stat: 'def' })).toBe('ガイコツけんしのみのまもり');
  });
});
