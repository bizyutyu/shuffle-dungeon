import type { Rng } from '@/core/rng';
import { clamp } from '@/core/math';
import type { ImpulseSpec } from '@/core/slider/impulse';

export interface SliderConfig {
  restPoint: number; // ばねの静止点（既定50）
  spring: number; // 静止点への復元の強さ
  damping: number; // 速度の減衰率
  noise: number; // 常時ドリフトの強さ
  maxSpeed: number;
}

export const DEFAULT_SLIDER_CONFIG: SliderConfig = {
  restPoint: 50,
  spring: 0.8,
  damping: 1.2,
  noise: 50,
  maxSpeed: 120,
};

/** 「速度を持つ質点をばねで吊る」モデルのカオス・スライダー本体。 */
export class ChaosSlider {
  value: number;
  private velocityInternal = 0;
  private readonly rng: Rng;
  private cfg: SliderConfig;

  constructor(rng: Rng, cfg: SliderConfig = DEFAULT_SLIDER_CONFIG) {
    this.rng = rng;
    this.cfg = { ...cfg }; // 呼び出し側のオブジェクト（既定値含む）を汚染しない
    this.value = this.cfg.restPoint;
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    this.velocityInternal += this.rng.range(-1, 1) * this.cfg.noise * dt;
    this.velocityInternal += (this.cfg.restPoint - this.value) * this.cfg.spring * dt;
    this.velocityInternal *= Math.exp(-this.cfg.damping * dt);
    this.velocityInternal = clamp(this.velocityInternal, -this.cfg.maxSpeed, this.cfg.maxSpeed);
    this.value = clamp(this.value + this.velocityInternal * dt, 0, 100);
    if (this.value <= 0 || this.value >= 100) this.velocityInternal *= -0.35; // 端で反発
  }

  applyImpulse(spec: ImpulseSpec): void {
    const jitter = this.rng.range(-1, 1) * spec.volatility;
    this.velocityInternal += spec.base + spec.bias + jitter;
  }

  /**
   * 内部速度そのもの（テスト・バランス計測用）。update()を呼ばずapplyImpulse()だけを
   * 積んで読めば、ばね・ノイズの影響を受けない純粋なインパルス収支として使える。
   * update()を挟んだ場合はその寄与も混ざるので、その用途では使わないこと。
   */
  get velocity(): number {
    return this.velocityInternal;
  }

  patchConfig(patch: Partial<SliderConfig>): void {
    Object.assign(this.cfg, patch);
  }
}
