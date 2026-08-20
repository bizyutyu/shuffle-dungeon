import type { Modifiers } from '@/core/types';
import type { RunContext } from '@/core/run/runContext';
import type { ImpulseSource, ImpulseSpec } from '@/core/slider/impulse';
import type { SliderConfig } from '@/core/slider/chaosSlider';

export type Rarity = 'common' | 'rare' | 'legendary';
export type RelicTag = 'slider' | 'offense' | 'defense' | 'loot' | 'risk';

export interface RelicHooks {
  /** 最終ステータス解決時。modsを直接ミューテートする。 */
  modifyStats?(mods: Modifiers, ctx: RunContext): void;
  /** スライダーへのインパルス発生時。specを書き換えて揺れ方を変える。 */
  modifyImpulse?(spec: ImpulseSpec, source: ImpulseSource, ctx: RunContext): void;
  /** 取得時にスライダーの物理特性そのものを変える。 */
  modifySliderConfig?(cfg: SliderConfig, ctx: RunContext): void;
  onAcquire?(ctx: RunContext): void;
  onFloorStart?(ctx: RunContext, floor: number): void;
  onKill?(ctx: RunContext, enemyId: string): void;
}

export interface RelicDef {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly tags: readonly RelicTag[];
  /** 排他グループ。同グループは1つしか出さない。 */
  readonly exclusiveGroup?: string;
  describe(ctx: RunContext): string;
  readonly hooks: RelicHooks;
}
