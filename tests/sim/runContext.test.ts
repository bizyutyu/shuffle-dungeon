import { describe, expect, it } from 'vitest';
import { RunContext } from '@/core/run/runContext';

describe('RunContextの固定タイムステップ', () => {
  it('累計時間が同じなら、渡すdtの刻み方（フレームレート）が違っても同じ結果になる', () => {
    const ctxA = new RunContext(11);
    for (let i = 0; i < 300; i++) ctxA.tick(1000 / 60); // 60fps相当、5秒分

    const ctxB = new RunContext(11);
    for (let i = 0; i < 150; i++) ctxB.tick(1000 / 30); // 30fps相当、5秒分

    expect(ctxA.slider.value).toBeCloseTo(ctxB.slider.value, 6);
    expect(ctxA.state.elapsedSec).toBeCloseTo(ctxB.state.elapsedSec, 6);
  });

  it('中程度のdtも固定ステップに分割され、フレームレートに依存しない', () => {
    const ctxA = new RunContext(5);
    for (let i = 0; i < 12; i++) ctxA.tick(1000 / 60); // 60fps相当、200ms分

    const ctxB = new RunContext(5);
    ctxB.tick(200); // 200ms分を1回でまとめて渡す

    expect(ctxA.slider.value).toBeCloseTo(ctxB.slider.value, 6);
  });

  it('巨大なdt（タブ復帰など）はMAX_ACCUMULATOR_MSでクランプされ、一度に進みすぎない', () => {
    const ctxA = new RunContext(5);
    ctxA.tick(250); // クランプ上限と同じ250ms分

    const ctxB = new RunContext(5);
    ctxB.tick(10_000); // 10秒分をまとめて渡す（タブが長時間非アクティブだった想定）

    expect(ctxA.slider.value).toBeCloseTo(ctxB.slider.value, 6);
    expect(ctxB.state.elapsedSec).toBeCloseTo(0.25, 2);
  });

  it('プレイヤーHPが0以下になったらrun:endedを発火し、以降tickしても状態が変化しない', () => {
    const ctx = new RunContext(99);
    let ended = false;
    ctx.on('run:ended', ({ victory }) => {
      ended = true;
      expect(victory).toBe(false);
    });

    ctx.state.playerHp = 0;
    ctx.tick(1000); // 少なくとも1固定ステップ分は進める

    expect(ended).toBe(true);
    expect(ctx.state.status).toBe('lost');

    const hpAfterEnd = ctx.state.playerHp;
    ctx.tick(1000);
    expect(ctx.state.playerHp).toBe(hpAfterEnd);
  });
});
