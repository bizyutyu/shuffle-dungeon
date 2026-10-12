import type {
  ActionId,
  ActionOutcome,
  ActionSlot,
  BattleWinner,
  CombatProfile,
  Combatant,
  TurnResult,
} from '@/core/types';
import type { Rng } from '@/core/rng';
import { clamp } from '@/core/math';
import { ACTIONS } from '@/core/combat/actions';
import { computeAmount, mpCostOf } from '@/core/combat/damage';

export interface BattleSide {
  combatant: Combatant;
  profile: CombatProfile;
}

export function canUse(slot: ActionSlot, side: BattleSide): boolean {
  return side.combatant.mp >= mpCostOf(ACTIONS[slot.id], side.profile);
}

export function usableActions(side: BattleSide): ActionSlot[] {
  return side.combatant.actions.filter((slot) => canUse(slot, side));
}

/** 使える行動の中から重み付きで1つ選ぶ。 */
export function chooseEnemyAction(side: BattleSide, rng: Rng): ActionSlot {
  const usable = usableActions(side);
  const total = usable.reduce((sum, s) => sum + s.weight, 0);
  if (usable.length === 0 || total <= 0) {
    throw new Error(`chooseEnemyAction: ${side.combatant.id} has no usable action`);
  }
  let r = rng.next() * total;
  for (const slot of usable) {
    r -= slot.weight;
    if (r < 0) return slot;
  }
  return usable[usable.length - 1] as ActionSlot;
}

/** すばやさが高い方が先に動く。同値ならプレイヤーが先。 */
export function playerActsFirst(player: BattleSide, enemy: BattleSide): boolean {
  return player.profile.stats.spd >= enemy.profile.stats.spd;
}

export function performAction(
  actor: BattleSide,
  opponent: BattleSide,
  slot: ActionSlot,
): ActionOutcome {
  const action = ACTIONS[slot.id];
  const target = slot.target === 'self' ? actor : opponent;
  const mpSpent = mpCostOf(action, actor.profile);
  if (actor.combatant.mp < mpSpent) {
    throw new Error(`performAction: ${actor.combatant.id} lacks MP for ${slot.id}`);
  }
  actor.combatant.mp -= mpSpent;

  const amount = computeAmount(action, actor.profile, target.profile);
  const delta = action.effect === 'damage' ? -amount : amount;
  target.combatant.hp = clamp(target.combatant.hp + delta, 0, target.profile.stats.maxHp);

  return {
    actorId: actor.combatant.id,
    actionId: slot.id,
    targetId: target.combatant.id,
    effect: action.effect,
    amount,
    mpSpent,
    targetHpAfter: target.combatant.hp,
    actorMpAfter: actor.combatant.mp,
    knockedOut: target.combatant.hp <= 0,
  };
}

function winnerOf(player: BattleSide, enemy: BattleSide): BattleWinner {
  // 1回の行動で倒れうるのは対象1人だけなので、両者が同時に0になることはない
  if (player.combatant.hp <= 0) return 'enemy';
  if (enemy.combatant.hp <= 0) return 'player';
  return null;
}

/**
 * 1ターン分を解決し、行動した順に結果を返す。決着がついた時点で残りの行動は行わない。
 * 敵の行動はターン開始時に（行動順に関係なく）決める。
 */
export function resolveTurn(
  player: BattleSide,
  enemy: BattleSide,
  playerActionId: ActionId,
  enemyRng: Rng,
): TurnResult {
  const playerSlot = player.combatant.actions.find((s) => s.id === playerActionId);
  if (!playerSlot) throw new Error(`resolveTurn: player has no action ${playerActionId}`);
  if (!canUse(playerSlot, player)) {
    throw new Error(`resolveTurn: player cannot use ${playerActionId}`);
  }
  const enemySlot = chooseEnemyAction(enemy, enemyRng);

  const order: [BattleSide, BattleSide, ActionSlot][] = playerActsFirst(player, enemy)
    ? [
        [player, enemy, playerSlot],
        [enemy, player, enemySlot],
      ]
    : [
        [enemy, player, enemySlot],
        [player, enemy, playerSlot],
      ];

  const outcomes: ActionOutcome[] = [];
  for (const [actor, opponent, slot] of order) {
    outcomes.push(performAction(actor, opponent, slot));
    const winner = winnerOf(player, enemy);
    if (winner) return { outcomes, winner };
  }
  return { outcomes, winner: null };
}
