import { describe, expect, it } from 'vitest';
import { ACTIONS } from '@/core/combat/actions';
import { computeAmount, mpCostOf } from '@/core/combat/damage';
import { side } from './helpers';

describe('computeAmount', () => {
  it('かくとうダメージは ちから×倍率 − 相手のみのまもり×0.5', () => {
    const a = side('player', { str: 10 }).profile;
    const t = side('enemy1', { def: 6, int: 20 }).profile;
    // 10*2.0 - 6*0.5 = 17（かしこさは関係しない）
    expect(computeAmount(ACTIONS.attack, a, t)).toBe(17);
  });

  it('まほうダメージは かしこさ×倍率 − 相手のかしこさ×0.5', () => {
    const a = side('player', { int: 8, str: 1 }).profile;
    const t = side('enemy1', { int: 4, def: 20 }).profile;
    // 8*2.5 - 4*0.5 = 18（みのまもりは関係しない）
    expect(computeAmount(ACTIONS.fire, a, t)).toBe(18);
  });

  it('回復には耐性がかからない', () => {
    const a = side('player', { str: 5, int: 7 }).profile;
    const t = side('enemy1', { def: 20, int: 20 }).profile;
    expect(computeAmount(ACTIONS.focus, a, t)).toBe(6); // 5*1.2
    expect(computeAmount(ACTIONS.heal, a, t)).toBe(14); // 7*2.0
  });

  it('耐性が上回ってもダメージは最低1', () => {
    const a = side('player', { str: 1 }).profile;
    const t = side('enemy1', { def: 20 }).profile;
    expect(computeAmount(ACTIONS.attack, a, t)).toBe(1);
  });

  it('レリックの倍率は種別ごとに掛かる', () => {
    const a = side('player', { str: 10, int: 10 }).profile;
    a.powerMul.kakutou = 1.5;
    const t = side('enemy1', { def: 0, int: 0 }).profile;
    expect(computeAmount(ACTIONS.attack, a, t)).toBe(30);
    expect(computeAmount(ACTIONS.fire, a, t)).toBe(25);
  });
});

describe('mpCostOf', () => {
  it('かくとうは常に0、まほうは軽減しても最低1', () => {
    const p = side('player').profile;
    p.mpCostDelta = -10;
    expect(mpCostOf(ACTIONS.attack, p)).toBe(0);
    expect(mpCostOf(ACTIONS.fire, p)).toBe(1);
    p.mpCostDelta = -2;
    expect(mpCostOf(ACTIONS.heal, p)).toBe(3);
  });
});
