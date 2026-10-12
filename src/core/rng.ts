export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  next(): number {
    // mulberry32
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(arr: readonly T[]): T {
    const item = arr[Math.floor(this.next() * arr.length)];
    if (item === undefined) throw new Error('Rng.pick: empty array');
    return item;
  }

  /** Fisher–Yates で新しい配列を返す（元の配列は変更しない）。 */
  shuffle<T>(arr: readonly T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const a = result[i] as T;
      result[i] = result[j] as T;
      result[j] = a;
    }
    return result;
  }
}

export interface RunRng {
  shuffle: Rng;
  enemyAi: Rng;
  loot: Rng;
}

export function createRunRng(seed: number): RunRng {
  return {
    shuffle: new Rng(seed ^ 0x1111_1111),
    enemyAi: new Rng(seed ^ 0x2222_2222),
    loot: new Rng(seed ^ 0x3333_3333),
  };
}
