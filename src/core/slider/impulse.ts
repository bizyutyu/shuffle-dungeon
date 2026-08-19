export type ImpulseSource =
  'attack' | 'move' | 'kill' | 'takeDamage' | 'floorClear' | 'critical' | 'misfire';

export interface ImpulseSpec {
  base: number; // 基準の押し込み量（+でCHAOS方向, -でAGGRESSIVE方向）
  volatility: number; // 揺らぎの絶対量。velocityへの加算幅(-volatility..+volatility)
  bias: number; // レリックによる方向づけ（Phase 2以降で使用）
}

// attack は反撃を伴わない（反撃は敵の自律攻撃としてtickEnemyAttacksで発生する）ため、
// 1タップの純収支は「攻撃タップ全部のattack合計 + 撃破時のkill」で決まる。
// killがattackを「ちょうど」相殺すると、プレイヤーがどう戦っても収支が恒等的に0になり
// 行動がスライダーに系統的な影響を与えなくなる（実測で判明: 常に最速連打が支配戦略化）。
// そのため撃破のたびにAGGRESSIVE方向へわずかに超過させる: attack*n + kill(n) ≈ FLAT_BONUS
// (< 0)。速く倒すほど撃破数が増えAGGRESSIVEへ、もたつくほど被弾(takeDamage)が
// 積もってCHAOSへ、という符号がプレイ内容で決まる構造を狙う。
const KILL_PER_TAP = -6;
const KILL_FLAT_BONUS = -14;

export const BASE_IMPULSES: Record<ImpulseSource, ImpulseSpec> = {
  attack: { base: 6, volatility: 4, bias: 0 },
  move: { base: -2, volatility: 2, bias: 0 },
  kill: { base: -22, volatility: 15, bias: 0 }, // taps=3(NORMAL基準)の既定値
  // 敵の自律攻撃(tickEnemyAttacks)で発生。時間経過・被弾数に応じてCHAOS方向へ押す。
  // 大きすぎるとプレイヤーの操作と無関係な一方向ポンプになりAGGRESSIVEが到達不能になる
  // ため（実測で判明）、killの超過分(FLAT_BONUS)より弱い値に抑えてある。
  takeDamage: { base: 4, volatility: 3, bias: 0 },
  floorClear: { base: 0, volatility: 25, bias: 0 }, // 方向すら不定＝完全カオス
  critical: { base: -20, volatility: 10, bias: 0 },
  misfire: { base: 18, volatility: 12, bias: 0 },
};

/** 撃破に要したタップ数に応じたkillインパルスを返す。ゾーンごとの撃破コスト差を相殺する。 */
export function killImpulseFor(taps: number): ImpulseSpec {
  return {
    base: KILL_PER_TAP * taps + KILL_FLAT_BONUS,
    volatility: BASE_IMPULSES.kill.volatility,
    bias: BASE_IMPULSES.kill.bias,
  };
}
