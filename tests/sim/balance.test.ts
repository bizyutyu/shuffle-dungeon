import { describe, expect, it } from 'vitest';
import { RunContext } from '@/core/run/runContext';
import { ZONES } from '@/core/slider/zones';
import { zoneModsAt } from '@/core/stats/resolve';

interface KillSimResult {
  velocityDiff: number;
  killed: boolean;
}

/**
 * sliderの値を指定ゾーンのanchorに固定した状態から、attackEnemyを連打して1体倒すまでの
 * 「インパルスによるvelocityの変化」を測る。tick()を呼ばずクールダウンだけ手動で解除するため、
 * ばね(spring)・ノイズの影響を受けず、純粋なインパルス収支だけを見ることができる。
 */
function simulateOneKill(seed: number, startValue: number): KillSimResult {
  const ctx = new RunContext(seed);
  ctx.slider.value = startValue;
  ctx.mods = zoneModsAt(startValue);

  const enemy = ctx.state.enemies[0];
  if (!enemy) throw new Error('no enemy');

  const before = ctx.slider.velocity;
  let guard = 0;
  while (enemy.alive) {
    ctx.state.elapsedSec += 10; // クールダウンを無視して連続攻撃させる
    ctx.attackEnemy(enemy.id);
    if (++guard > 100) throw new Error('kill did not converge');
  }
  return { velocityDiff: ctx.slider.velocity - before, killed: !enemy.alive };
}

describe('インパルス収支バランス', () => {
  it('測定系そのものが値を動かせている（前提の健全性チェック）', () => {
    const { velocityDiff } = simulateOneKill(1, 50);
    expect(velocityDiff).not.toBe(0);
  });

  it('各ゾーンで1体撃破あたりの純インパルス平均がゾーン間で大きくブレない（一方向ラチェットにならない）', () => {
    // 撃破1回ごとにAGGRESSIVE方向へKILL_FLAT_BONUS分だけ寄せる設計（速く倒すほど
    // AGGRESSIVEへ進む）なので、収支は0ではなく一定のマイナス値に揃うのが正しい。
    // ここで見たいのは「ゾーンによって符号や大きさが極端に変わらないこと」。
    const SAMPLES = 40;
    const avgs: number[] = [];
    for (const zone of ZONES) {
      let total = 0;
      let count = 0;
      for (let i = 0; i < SAMPLES; i++) {
        const { velocityDiff, killed } = simulateOneKill(3000 + i, zone.anchor);
        if (killed) {
          total += velocityDiff;
          count++;
        }
      }
      expect(count).toBeGreaterThan(0);
      avgs.push(total / count);
    }
    const maxAvg = Math.max(...avgs);
    const minAvg = Math.min(...avgs);
    expect(maxAvg - minAvg).toBeLessThan(25);
  });
});
