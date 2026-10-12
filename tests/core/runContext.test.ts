import { describe, expect, it } from 'vitest';
import { MAX_SHUFFLES, MAX_TURNS_PER_BATTLE } from '@/core/balance';
import { RunContext } from '@/core/run/runContext';
import { computeScore } from '@/core/run/score';

describe('RunContext', () => {
  it('シャッフルは準備中に上限回数までしかできない', () => {
    const ctx = new RunContext(1);
    for (let i = 0; i < MAX_SHUFFLES; i++) expect(ctx.shuffle()).toBe(true);
    expect(ctx.shuffle()).toBe(false);
    expect(ctx.state.shufflesLeft).toBe(0);
  });

  it('出発後はシャッフルできず、準備中は行動できない', () => {
    const ctx = new RunContext(1);
    expect(ctx.act('attack')).toBeNull();
    expect(ctx.depart()).toBe(true);
    expect(ctx.shuffle()).toBe(false);
    expect(ctx.state.step).toBe('battle');
  });

  it('敵を倒すとレリック選択になり、選ぶと次のフェーズで全回復して始まる', () => {
    const ctx = new RunContext(1);
    ctx.depart();
    ctx.currentEnemy.hp = 1;
    ctx.state.player.points.spd.value = 20;
    ctx.state.player.hp = 5;
    ctx.act('attack');
    expect(ctx.state.step).toBe('relic');
    expect(ctx.state.relicChoices).toHaveLength(3);

    expect(ctx.selectRelic('not_offered')).toBe(false);
    const pick = ctx.state.relicChoices[0] ?? '';
    expect(ctx.selectRelic(pick)).toBe(true);
    expect(ctx.state.phase).toBe(2);
    expect(ctx.state.player.hp).toBe(ctx.playerProfile().stats.maxHp);
  });

  it('決着がつかないままターン上限に達したら負け', () => {
    const ctx = new RunContext(1);
    ctx.depart();
    // 互いに削れないよう、プレイヤーの行動を自分への回復に固定し、敵も回復しかしない
    ctx.currentEnemy.actions = [{ id: 'focus', target: 'self', weight: 1 }];
    for (let i = 0; i < MAX_TURNS_PER_BATTLE; i++) ctx.act('focus');
    expect(ctx.state.status).toBe('lost');
    expect(ctx.state.endReason).toBe('timeout');
    expect(ctx.state.score).toBe(computeScore(1, false));
  });

  it('同じシード・同じ操作なら同じ結果になる', () => {
    const play = (seed: number) => {
      const ctx = new RunContext(seed);
      ctx.shuffle();
      ctx.depart();
      const log: unknown[] = [];
      while (ctx.state.step === 'battle' || ctx.state.step === 'relic') {
        if (ctx.state.step === 'relic') ctx.selectRelic(ctx.state.relicChoices[0] ?? '');
        else log.push(ctx.act(ctx.usableActionIds()[0] ?? 'attack'));
      }
      return { log, state: ctx.state };
    };
    expect(play(123)).toEqual(play(123));
  });
});

describe('computeScore', () => {
  it('到達フェーズ×1000 ＋ 勝利で5000', () => {
    expect(computeScore(3, false)).toBe(3000);
    expect(computeScore(5, true)).toBe(10000);
  });
});
