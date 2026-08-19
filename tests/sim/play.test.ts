import { describe, expect, it } from 'vitest';
import { RunContext } from '@/core/run/runContext';
import { zoneAt } from '@/core/slider/zones';

const FIXED_STEP_MS = 1000 / 60;

interface PlayResult {
  min: number;
  max: number;
  status: string;
  aggPct: number;
  chaosPct: number;
}

/** 一定間隔で生存中の敵を順にタップし続ける自動プレイをシミュレーションする。 */
function simulatePlay(seed: number, tapIntervalMs: number, durationSec: number): PlayResult {
  const ctx = new RunContext(seed);
  let elapsedMs = 0;
  let lastTapMs = 0;
  let min = 100;
  let max = 0;
  let aliveIdx = 0;
  let aggMs = 0;
  let chaosMs = 0;

  while (elapsedMs < durationSec * 1000 && ctx.state.status === 'running') {
    ctx.tick(FIXED_STEP_MS);
    elapsedMs += FIXED_STEP_MS;

    if (elapsedMs - lastTapMs >= tapIntervalMs) {
      lastTapMs = elapsedMs;
      const enemies = ctx.state.enemies;
      while (aliveIdx < enemies.length && !enemies[aliveIdx]?.alive) aliveIdx++;
      const target = enemies[aliveIdx];
      if (target) ctx.attackEnemy(target.id);
    }

    min = Math.min(min, ctx.slider.value);
    max = Math.max(max, ctx.slider.value);
    const zone = zoneAt(ctx.slider.value);
    if (zone === 'aggressive') aggMs += FIXED_STEP_MS;
    if (zone === 'chaos') chaosMs += FIXED_STEP_MS;
  }

  return {
    min,
    max,
    status: ctx.state.status,
    aggPct: (aggMs / elapsedMs) * 100,
    chaosPct: (chaosMs / elapsedMs) * 100,
  };
}

describe('実プレイ相当のゾーン到達・生死シミュレーション', () => {
  it('最速連打でもAGGRESSIVE帯に触れる（到達不能に戻っていないことの回帰確認）', () => {
    const SAMPLES = 20;
    let touchedAggressive = false;
    for (let i = 0; i < SAMPLES; i++) {
      const r = simulatePlay(5000 + i, 100, 60);
      if (r.min < 35) touchedAggressive = true;
    }
    expect(touchedAggressive).toBe(true);
  });

  it('攻撃間隔を極端に空けると死亡しうる（敵の自律攻撃が機能している）', () => {
    const SAMPLES = 10;
    let deaths = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const r = simulatePlay(6000 + i, 3000, 60);
      if (r.status === 'lost') deaths++;
    }
    expect(deaths).toBeGreaterThan(0);
  });

  it('こまめに攻撃し続ければ生存できる（理不尽な即死ゲームになっていない）', () => {
    const SAMPLES = 10;
    let deaths = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const r = simulatePlay(7000 + i, 300, 60);
      if (r.status === 'lost') deaths++;
    }
    expect(deaths).toBe(0);
  });
});
