import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/rng';
import { chooseEnemyAction, playerActsFirst, resolveTurn } from '@/core/combat/turn';
import { side } from './helpers';

describe('playerActsFirst', () => {
  it('すばやさが同じならプレイヤーが先', () => {
    expect(playerActsFirst(side('player', { spd: 5 }), side('enemy1', { spd: 5 }))).toBe(true);
    expect(playerActsFirst(side('player', { spd: 4 }), side('enemy1', { spd: 5 }))).toBe(false);
  });
});

describe('resolveTurn', () => {
  it('すばやさの順に両者が1回ずつ行動する', () => {
    const p = side('player', { spd: 3 });
    const e = side('enemy1', { spd: 9 });
    const r = resolveTurn(p, e, 'attack', new Rng(1));
    expect(r.outcomes.map((o) => o.actorId)).toEqual(['enemy1', 'player']);
    expect(r.winner).toBeNull();
  });

  it('先に動いた側で決着したら、後の行動は行わない', () => {
    const p = side('player', { spd: 9, str: 20 });
    const e = side('enemy1', { spd: 1 });
    e.combatant.hp = 1;
    const r = resolveTurn(p, e, 'attack', new Rng(1));
    expect(r.outcomes).toHaveLength(1);
    expect(r.winner).toBe('player');
  });

  it('対象が自分になった攻撃で自分が倒れたら負け', () => {
    const p = side('player', { spd: 9 }, [{ id: 'attack', target: 'self' }]);
    p.combatant.hp = 1;
    const r = resolveTurn(p, side('enemy1'), 'attack', new Rng(1));
    expect(r.outcomes[0]?.targetId).toBe('player');
    expect(r.winner).toBe('enemy');
  });

  it('対象が相手になったヒールは相手を回復し、たいりょくは最大値を超えない', () => {
    const p = side('player', { spd: 9 }, [{ id: 'heal', target: 'opponent' }]);
    const e = side('enemy1', { spd: 1 }, [{ id: 'focus', target: 'self' }]);
    e.combatant.hp = e.profile.stats.maxHp - 3;
    const r = resolveTurn(p, e, 'heal', new Rng(1));
    expect(r.outcomes[0]?.targetId).toBe('enemy1');
    expect(e.combatant.hp).toBe(e.profile.stats.maxHp);
  });

  it('まほうでせいしんりょくを消費し、足りなければ使えない', () => {
    const p = side('player', { spd: 9 }, [{ id: 'fire' }]);
    const before = p.combatant.mp;
    resolveTurn(p, side('enemy1'), 'fire', new Rng(1));
    expect(p.combatant.mp).toBe(before - 4);
    p.combatant.mp = 3;
    expect(() => resolveTurn(p, side('enemy1'), 'fire', new Rng(1))).toThrow();
  });
});

describe('chooseEnemyAction', () => {
  it('せいしんりょくが足りないまほうは選ばない', () => {
    const e = side('enemy1', {}, [{ id: 'attack' }, { id: 'fire', weight: 100 }]);
    e.combatant.mp = 0;
    const rng = new Rng(3);
    for (let i = 0; i < 50; i++) expect(chooseEnemyAction(e, rng).id).toBe('attack');
  });
});
