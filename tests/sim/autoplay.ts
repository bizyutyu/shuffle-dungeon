import { ACTIONS } from '@/core/combat/actions';
import { computeAmount } from '@/core/combat/damage';
import type { ActionId } from '@/core/types';
import type { RunContext } from '@/core/run/runContext';
import { Rng } from '@/core/rng';

export type ShufflePolicy = 'none' | 'all' | 'greedy';
export type ActPolicy = 'random' | 'smart';

function pointSum(ctx: RunContext): number {
  return Object.values(ctx.state.player.points).reduce((a, b) => a + b.value, 0);
}

function prepare(ctx: RunContext, policy: ShufflePolicy): void {
  if (policy === 'all') while (ctx.shuffle());
  if (policy === 'greedy') {
    // 人間が準備画面で「良い配られ方」まで粘るのを模す: 主人公の素点合計が全員の平均を下回るうちは配り直す
    const mean = (): number => {
      const all = [ctx.state.player, ...ctx.state.enemies];
      return (
        all.reduce((sum, c) => sum + Object.values(c.points).reduce((a, b) => a + b.value, 0), 0) /
        all.length
      );
    };
    ctx.shuffle();
    while (pointSum(ctx) < mean() && ctx.shuffle());
  }
}

/** 相手を削る > 自分を回復 > 相手を回復 > 自分を削る の順に選ぶ。同じ順位なら効果量が大きい方。 */
function smartAction(ctx: RunContext): ActionId {
  const usable = ctx.usableActionIds();
  const player = ctx.state.player;
  const me = ctx.playerProfile();
  const foe = ctx.enemyProfile();
  const amount = (id: ActionId): number => {
    const slot = player.actions.find((s) => s.id === id);
    return computeAmount(ACTIONS[id], me, slot?.target === 'self' ? me : foe);
  };
  const lowHp = player.hp < ctx.playerProfile().stats.maxHp * 0.4;
  const rank = (id: ActionId): number => {
    const slot = player.actions.find((s) => s.id === id);
    const effect = ACTIONS[id].effect;
    if (!slot) return -1;
    if (slot.target === 'self' && effect === 'heal') return lowHp ? 4 : 2;
    if (slot.target === 'opponent' && effect === 'damage') return 3;
    if (slot.target === 'opponent' && effect === 'heal') return 1;
    return 0;
  };
  return [...usable].sort((a, b) => rank(b) - rank(a) || amount(b) - amount(a))[0] ?? 'attack';
}

export interface PlayResult {
  victory: boolean;
  phase: number;
  reason: string | null;
}

export function autoplay(
  ctx: RunContext,
  shuffle: ShufflePolicy,
  act: ActPolicy,
  seed: number,
): PlayResult {
  const rng = new Rng(seed ^ 0x5eed);
  prepare(ctx, shuffle);
  ctx.depart();
  while (ctx.state.step === 'battle' || ctx.state.step === 'relic') {
    if (ctx.state.step === 'relic') {
      ctx.selectRelic(rng.pick(ctx.state.relicChoices));
    } else {
      ctx.act(act === 'smart' ? smartAction(ctx) : rng.pick(ctx.usableActionIds()));
    }
  }
  return {
    victory: ctx.state.status === 'won',
    phase: ctx.state.phase,
    reason: ctx.state.endReason,
  };
}
