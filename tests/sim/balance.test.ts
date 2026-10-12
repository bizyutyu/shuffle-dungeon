import { describe, expect, it } from 'vitest';
import { RunContext } from '@/core/run/runContext';
import { autoplay } from './autoplay';

const SEEDS = 1000;

// 数値の調整はプレイしながら人が行うので、勝率そのものは問わない。
// 「何度試しても絶対に勝てない」状態になっていないことだけを守る。
describe('バランス（自動プレイ）', () => {
  it('考えて行動し、配り直しも吟味すれば、勝てるシードが存在する', () => {
    const won = Array.from({ length: SEEDS }, (_, i) => i + 1).some(
      (seed) => autoplay(new RunContext(seed), 'greedy', 'smart', seed).victory,
    );
    expect(won).toBe(true);
  });
});
