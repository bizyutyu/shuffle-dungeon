import { describe, expect, it } from 'vitest';
import { zoneModsAt } from '@/core/stats/resolve';
import { ZONES, zoneAt } from '@/core/slider/zones';
import { ChaosSlider, DEFAULT_SLIDER_CONFIG } from '@/core/slider/chaosSlider';
import { BASE_IMPULSES } from '@/core/slider/impulse';
import { Rng } from '@/core/rng';

describe('zoneModsAt', () => {
  it('各ゾーンのanchorで純度100%のmodsを返す', () => {
    for (const zone of ZONES) {
      expect(zoneModsAt(zone.anchor)).toEqual(zone.mods);
    }
  });

  it('範囲外の値はクランプされた端のゾーンのmodsを返す', () => {
    const first = ZONES[0]!;
    const last = ZONES[ZONES.length - 1]!;
    expect(zoneModsAt(-10)).toEqual(first.mods);
    expect(zoneModsAt(110)).toEqual(last.mods);
  });

  it('anchor間の中点では線形補間された値になる', () => {
    const aggressive = ZONES[0]!;
    const normal = ZONES[1]!;
    const mid = (aggressive.anchor + normal.anchor) / 2;
    const mods = zoneModsAt(mid);
    const expectedAtkMul = (aggressive.mods.atkMul + normal.mods.atkMul) / 2;
    expect(mods.atkMul).toBeCloseTo(expectedAtkMul, 5);
  });
});

describe('zoneAt', () => {
  it('境界値が重複せずちょうど1ゾーンに属する', () => {
    for (const zone of ZONES) {
      expect(zoneAt(zone.bounds[0])).toBeDefined();
      expect(zoneAt(zone.bounds[1])).toBeDefined();
    }
    // 隣接ゾーンの境界（例: 35, 65）で重複判定にならないことを確認
    const boundaries = new Set(ZONES.flatMap((z) => z.bounds));
    for (const b of boundaries) {
      expect(() => zoneAt(b)).not.toThrow();
    }
  });
});

describe('ChaosSlider', () => {
  it('5分間のシミュレーションで値が常に0-100の範囲に収まる', () => {
    const rng = new Rng(42);
    const slider = new ChaosSlider(rng, { ...DEFAULT_SLIDER_CONFIG });
    const dtMs = 16;
    const totalSteps = Math.floor((5 * 60 * 1000) / dtMs);

    let sinceImpulse = 0;
    for (let i = 0; i < totalSteps; i++) {
      slider.update(dtMs);
      sinceImpulse += dtMs;
      if (sinceImpulse >= 3000) {
        slider.applyImpulse(BASE_IMPULSES.attack);
        sinceImpulse = 0;
      }
      expect(slider.value).toBeGreaterThanOrEqual(0);
      expect(slider.value).toBeLessThanOrEqual(100);
    }
  });

  it('5分間の無操作放置では大きく動かない（ノイズだけでAGGRESSIVE/CHAOSまで届かない）', () => {
    const dtMs = 16;
    const totalSteps = Math.floor((5 * 60 * 1000) / dtMs);

    // 揺れの主因はプレイヤーの行動であるべきで、無操作の環境ノイズだけで
    // ゾーンが激しく変わってしまうと「操作を読む」判断が成立しなくなる
    for (let seed = 0; seed < 8; seed++) {
      const rng = new Rng(seed);
      const slider = new ChaosSlider(rng, { ...DEFAULT_SLIDER_CONFIG });
      for (let i = 0; i < totalSteps; i++) {
        slider.update(dtMs);
      }
      expect(slider.value).toBeGreaterThan(20);
      expect(slider.value).toBeLessThan(80);
    }
  });

  it('applyImpulseで値が動く（決定論的、シード固定で再現可能）', () => {
    const rng1 = new Rng(7);
    const slider1 = new ChaosSlider(rng1, { ...DEFAULT_SLIDER_CONFIG });
    const rng2 = new Rng(7);
    const slider2 = new ChaosSlider(rng2, { ...DEFAULT_SLIDER_CONFIG });

    for (let i = 0; i < 50; i++) {
      slider1.update(16);
      slider1.applyImpulse(BASE_IMPULSES.attack);
      slider2.update(16);
      slider2.applyImpulse(BASE_IMPULSES.attack);
    }
    expect(slider1.value).not.toBe(50);
    expect(slider1.value).toBe(slider2.value);
  });
});
