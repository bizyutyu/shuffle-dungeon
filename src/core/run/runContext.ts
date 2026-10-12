import type {
  ActionId,
  CombatProfile,
  Combatant,
  EndReason,
  RunState,
  TurnResult,
} from '@/core/types';
import { createRunRng, type RunRng } from '@/core/rng';
import { MAX_SHUFFLES, MAX_TURNS_PER_BATTLE, RELIC_CHOICE_COUNT } from '@/core/balance';
import { baseProfile, createCombatant, restoreFully } from '@/core/combat/combatant';
import { ENEMY_DEFS, PLAYER_DEF, TOTAL_PHASES } from '@/core/combat/roster';
import { canUse, resolveTurn, type BattleSide } from '@/core/combat/turn';
import { shuffleWorld } from '@/core/stats/shuffle';
import { TypedEmitter, type RunEvents } from '@/core/events';
import { computeScore } from '@/core/run/score';
import { profileWithRelics } from '@/core/relics/apply';
import { rollRelicChoices } from '@/core/relics/pool';
import '@/core/relics/defs'; // 副作用: 全レリックをレジストリに登録する

/**
 * 1ラン分の状態を持ち、コマンド（shuffle / depart / act / selectRelic）を受けて進める。
 * 各コマンドは今のステップで受け付けられないときは何もせず false / null を返す。
 */
export class RunContext extends TypedEmitter<RunEvents> {
  readonly state: RunState;
  readonly rng: RunRng;

  constructor(seed: number) {
    super();
    this.rng = createRunRng(seed);
    this.state = {
      seed,
      step: 'prep',
      status: 'running',
      endReason: null,
      phase: 1,
      turn: 0,
      shufflesLeft: MAX_SHUFFLES,
      player: createCombatant(PLAYER_DEF),
      enemies: ENEMY_DEFS.map(createCombatant),
      relicIds: [],
      relicChoices: [],
      score: 0,
    };
  }

  get currentEnemy(): Combatant {
    const enemy = this.state.enemies[this.state.phase - 1];
    if (!enemy) throw new Error(`no enemy for phase ${this.state.phase}`);
    return enemy;
  }

  playerProfile(): CombatProfile {
    return profileWithRelics(this.state.player.points, this.state.relicIds);
  }

  enemyProfile(enemy: Combatant = this.currentEnemy): CombatProfile {
    return baseProfile(enemy.points);
  }

  /** プレイヤーが今使える行動。MPが足りないまほうは含まない。 */
  usableActionIds(): ActionId[] {
    const side = this.playerSide();
    return side.combatant.actions.filter((s) => canUse(s, side)).map((s) => s.id);
  }

  /** ぼうけんじゅんび: 全員の素点と行動の対象を配り直す。 */
  shuffle(): boolean {
    if (this.state.step !== 'prep' || this.state.shufflesLeft <= 0) return false;
    shuffleWorld([this.state.player, ...this.state.enemies], this.rng.shuffle);
    this.state.shufflesLeft -= 1;
    // 配り直しで最大値が変わるので、準備画面で見せる現在値も合わせる
    restoreFully(this.state.player, this.playerProfile());
    for (const enemy of this.state.enemies) restoreFully(enemy, this.enemyProfile(enemy));
    this.emit('prep:shuffled', { shufflesLeft: this.state.shufflesLeft });
    return true;
  }

  depart(): boolean {
    if (this.state.step !== 'prep') return false;
    this.startBattle(1);
    return true;
  }

  act(actionId: ActionId): TurnResult | null {
    if (this.state.step !== 'battle') return null;
    const player = this.playerSide();
    const slot = player.combatant.actions.find((s) => s.id === actionId);
    if (!slot || !canUse(slot, player)) return null;

    this.state.turn += 1;
    const result = resolveTurn(player, this.enemySide(), actionId, this.rng.enemyAi);
    this.emit('turn:resolved', result);

    if (result.winner === 'enemy') {
      this.endRun('defeated');
    } else if (result.winner === 'player') {
      this.onBattleWon();
    } else if (this.state.turn >= MAX_TURNS_PER_BATTLE) {
      this.endRun('timeout');
    }
    return result;
  }

  selectRelic(relicId: string): boolean {
    if (this.state.step !== 'relic' || !this.state.relicChoices.includes(relicId)) return false;
    this.state.relicIds.push(relicId);
    this.state.relicChoices = [];
    this.emit('relic:acquired', { id: relicId });
    this.startBattle(this.state.phase + 1);
    return true;
  }

  private playerSide(): BattleSide {
    return { combatant: this.state.player, profile: this.playerProfile() };
  }

  private enemySide(): BattleSide {
    return { combatant: this.currentEnemy, profile: this.enemyProfile() };
  }

  private startBattle(phase: number): void {
    this.state.phase = phase;
    this.state.turn = 0;
    this.state.step = 'battle';
    restoreFully(this.state.player, this.playerProfile());
    restoreFully(this.currentEnemy, this.enemyProfile());
    this.emit('battle:started', { phase, enemyId: this.currentEnemy.id });
  }

  private onBattleWon(): void {
    this.emit('battle:won', { phase: this.state.phase });
    if (this.state.phase >= TOTAL_PHASES) {
      this.endRun('cleared');
      return;
    }
    this.state.step = 'relic';
    this.state.relicChoices = rollRelicChoices(
      this.state.relicIds,
      this.rng.loot,
      RELIC_CHOICE_COUNT,
    ).map((r) => r.id);
  }

  private endRun(reason: EndReason): void {
    const victory = reason === 'cleared';
    this.state.step = 'ended';
    this.state.status = victory ? 'won' : 'lost';
    this.state.endReason = reason;
    this.state.score = computeScore(this.state.phase, victory);
    this.emit('run:ended', { victory, reason, score: this.state.score });
  }
}
