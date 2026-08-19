import { describe, expect, it } from 'vitest';
import { Rng } from '@/core/rng';

describe('Rng', () => {
  it('同じシードから同じ数列を生成する（決定論的）', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('既知シードに対するゴールデン値（RNG実装を変えたら気づけるようにする）', () => {
    const rng = new Rng(42);
    const seq = Array.from({ length: 5 }, () => rng.next());
    expect(seq).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693,
      0.17481389874592423,
    ]);
  });

  it('異なるシードは異なる数列を生成する', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });
});
