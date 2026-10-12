import type { ActionKind, Stats } from '@/core/types';

export type Rarity = 'common' | 'rare' | 'legendary';
export type RelicTag = 'stat' | 'kakutou' | 'mahou';

/** レリックはプレイヤーの戦闘能力にだけ作用する。 */
export interface RelicHooks {
  /** すばやさ以外のステータスに加算する。statsを直接書き換える。 */
  modifyStats?(stats: Stats): void;
  /** かくとう／まほうの倍率に掛ける係数を返す。 */
  powerMultiplier?(kind: ActionKind): number;
  /** まほうの消費MPへの加算値を返す（負で軽減）。 */
  mpCostDelta?(): number;
}

export interface RelicDef {
  readonly id: string;
  readonly name: string;
  readonly rarity: Rarity;
  readonly tags: readonly RelicTag[];
  /** 排他グループ。同グループは1つしか出さない。 */
  readonly exclusiveGroup?: string;
  readonly description: string;
  readonly hooks: RelicHooks;
}
