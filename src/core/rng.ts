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
}

export interface RunRng {
  combat: Rng;
  slider: Rng;
  loot: Rng;
}

export function createRunRng(seed: number): RunRng {
  return {
    combat: new Rng(seed ^ 0x1111_1111),
    slider: new Rng(seed ^ 0x2222_2222),
    loot: new Rng(seed ^ 0x3333_3333),
  };
}
